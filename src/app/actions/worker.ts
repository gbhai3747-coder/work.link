"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type WorkerActionResult = { ok: true } | { ok: false; error: string };

export type WorkerLocationStatus = {
  lat: number | null;
  lng: number | null;
  locationUpdatedAt: string | null;
};

const coordinates = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const availabilitySchema = z.object({
  available: z.boolean(),
  coords: coordinates.optional(),
});

/**
 * Toggles worker availability. Going online requires the worker's current
 * coordinates (collected via the browser Geolocation API); going offline clears
 * the stored location for privacy.
 */
export async function setWorkerAvailability(
  input: z.infer<typeof availabilitySchema>
): Promise<WorkerActionResult> {
  const { profile } = await requireRole("worker");
  const parsed = availabilitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid availability request." };
  }

  const supabase = await createClient();

  if (parsed.data.available) {
    if (!parsed.data.coords) {
      return { ok: false, error: "Your location is required to go online." };
    }
    const { error } = await supabase
      .from("worker_profiles")
      .update({
        is_available: true,
        lat: parsed.data.coords.lat,
        lng: parsed.data.coords.lng,
        location_updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
    if (error) {
      console.error("setWorkerAvailability (online) failed:", error);
      return { ok: false, error: "Couldn't update your availability. Try again." };
    }
  } else {
    const { error } = await supabase
      .from("worker_profiles")
      .update({
        is_available: false,
        lat: null,
        lng: null,
        location_updated_at: null,
      })
      .eq("id", profile.id);
    if (error) {
      console.error("setWorkerAvailability (offline) failed:", error);
      return { ok: false, error: "Couldn't update your availability. Try again." };
    }
  }

  revalidatePath("/worker/dashboard");
  return { ok: true };
}

/**
 * Refreshes the worker's location while they're available. Used by the
 * "Update location" button so workers don't have to re-share location to keep
 * it fresh.
 */
export async function updateWorkerLocation(
  input: z.infer<typeof coordinates>
): Promise<WorkerActionResult> {
  const { profile } = await requireRole("worker");
  const parsed = coordinates.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid location." };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("worker_profiles")
    .select("is_available")
    .eq("id", profile.id)
    .single();
  if (!current?.is_available) {
    return {
      ok: false,
      error: "You need to be available to update your location.",
    };
  }

  const { error } = await supabase
    .from("worker_profiles")
    .update({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      location_updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
  if (error) {
    console.error("updateWorkerLocation failed:", error);
    return { ok: false, error: "Couldn't update your location. Try again." };
  }

  revalidatePath("/worker/dashboard");
  return { ok: true };
}

const servicesSchema = z.object({
  serviceIds: z.array(z.string().uuid()).max(20),
});

/** Replaces the worker's offered services (keeps prices from previous entries). */
export async function saveWorkerServices(
  input: z.infer<typeof servicesSchema>
): Promise<WorkerActionResult> {
  const { profile } = await requireRole("worker");
  const parsed = servicesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid services selection." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("services")
    .select("id")
    .in("id", parsed.data.serviceIds);
  if (!existing || existing.length !== parsed.data.serviceIds.length) {
    return { ok: false, error: "One or more selected services are invalid." };
  }

  const { error: deleteError } = await supabase
    .from("worker_services")
    .delete()
    .eq("worker_id", profile.id);
  if (deleteError) {
    console.error("saveWorkerServices (delete) failed:", deleteError);
    return { ok: false, error: "Couldn't update your services. Try again." };
  }

  if (parsed.data.serviceIds.length > 0) {
    const { error: insertError } = await supabase.from("worker_services").insert(
      parsed.data.serviceIds.map((serviceId) => ({
        worker_id: profile.id,
        service_id: serviceId,
      }))
    );
    if (insertError) {
      console.error("saveWorkerServices (insert) failed:", insertError);
      return { ok: false, error: "Couldn't update your services. Try again." };
    }
  }

  revalidatePath("/worker/dashboard");
  return { ok: true };
}

const profileSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  experienceYears: z.number().int().min(0).max(100).optional(),
  serviceRadiusKm: z.number().min(1).max(500).optional(),
});

export async function saveWorkerProfile(
  input: z.infer<typeof profileSchema>
): Promise<WorkerActionResult> {
  const { profile } = await requireRole("worker");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check your profile details." };
  }

  const update: Database["public"]["Tables"]["worker_profiles"]["Update"] = {};
  if (parsed.data.description !== undefined) {
    update.description = parsed.data.description || null;
  }
  if (parsed.data.experienceYears !== undefined) {
    update.experience_years = parsed.data.experienceYears;
  }
  if (parsed.data.serviceRadiusKm !== undefined) {
    update.service_radius_km = parsed.data.serviceRadiusKm;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("worker_profiles")
    .update(update)
    .eq("id", profile.id);
  if (error) {
    console.error("saveWorkerProfile failed:", error);
    return { ok: false, error: "Couldn't save your profile. Try again." };
  }

  revalidatePath("/worker/dashboard");
  return { ok: true };
}

/**
 * Returns the worker's own stored location (via the security-definer RPC).
 * Used to show "location last updated" state on the dashboard.
 */
export async function getWorkerLocationStatus(): Promise<
  WorkerLocationStatus | { error: string }
> {
  await requireRole("worker");
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_own_location", {});
  if (error) {
    console.error("getWorkerLocationStatus failed:", error);
    return { error: "Couldn't load your location status." };
  }

  const row = data?.[0];
  return {
    lat: row?.lat ?? null,
    lng: row?.lng ?? null,
    locationUpdatedAt: row?.location_updated_at ?? null,
  };
}
