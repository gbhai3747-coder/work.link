"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canTransition } from "@/lib/bookings";
import { getCurrentProfile, getCurrentUser, requireRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export type BookingActionResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string };

const bookingSchema = z.object({
  workerId: z.string().uuid(),
  serviceId: z.string().uuid(),
  jobDescription: z.string().trim().min(10).max(2000),
  preferredTime: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Choose a valid date and time.",
    }),
  address: z.string().trim().min(3).max(500),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

/**
 * Creates a booking request from a customer to a worker. Location is stored on
 * the booking only when the customer opted in (required for the job itself).
 */
export async function createBooking(
  input: z.infer<typeof bookingSchema>
): Promise<BookingActionResult> {
  // TEMP DIAGNOSTICS - safe info only (no values/keys/coordinates). Remove after verifying.
  console.error("[booking:diag] createBooking started", {
    hasWorkerId: Boolean(input.workerId),
    hasServiceId: Boolean(input.serviceId),
    addressLength: input.address.length,
    hasCoords: input.lat != null && input.lng != null,
  });

  const { profile } = await requireRole("customer");
  // TEMP DIAGNOSTICS - safe info only. Remove after verifying.
  console.error("[booking:diag] auth ok", { role: profile.role });

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    // TEMP DIAGNOSTICS - safe info only (field names, not values). Remove after verifying.
    console.error("[booking:diag] validation failed", {
      paths: parsed.error.issues.map((issue) => issue.path.join(".")),
    });
    return {
      ok: false,
      error: "Please check the booking details and try again.",
    };
  }

  const {
    workerId,
    serviceId,
    jobDescription,
    preferredTime,
    address,
    lat,
    lng,
  } = parsed.data;

  const supabase = await createClient();

  // The worker must actually offer the selected service.
  const { data: workerService } = await supabase
    .from("worker_services")
    .select("id")
    .eq("worker_id", workerId)
    .eq("service_id", serviceId)
    .maybeSingle();
  if (!workerService) {
    return {
      ok: false,
      error: "This worker doesn't offer the selected service.",
    };
  }

  const { data: created, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: profile.id,
      worker_id: workerId,
      service_id: serviceId,
      job_description: jobDescription,
      preferred_time: new Date(preferredTime).toISOString(),
      address,
      lat: lat ?? null,
      lng: lng ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[booking:diag] createBooking failed:", error);
    return {
      ok: false,
      error: "We couldn't create the booking. Please try again.",
    };
  }

  revalidatePath(`/workers/${workerId}`);
  return { ok: true, bookingId: created.id };
}

const updateStatusSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum([
    "accepted",
    "rejected",
    "in_progress",
    "completed",
    "cancelled",
  ]),
});

/**
 * Moves a booking to the next status. The allowed transitions and the acting
 * party are validated here AND enforced again by the `enforce_booking_status_transition`
 * trigger in the database, so a malicious client can never bypass the rules.
 */
export async function updateBookingStatus(
  input: z.infer<typeof updateStatusSchema>
): Promise<BookingActionResult> {
  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }
  const { bookingId, status } = parsed.data;

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in first." };
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Please sign in first." };

  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, customer_id, worker_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) {
    return { ok: false, error: "Booking not found." };
  }

  if (!canTransition(profile.role, booking.status, status)) {
    return {
      ok: false,
      error: "This action isn't allowed for the current booking status.",
    };
  }

  const isActor =
    profile.role === "worker"
      ? booking.worker_id === profile.id
      : booking.customer_id === profile.id;
  if (!isActor) {
    return { ok: false, error: "This action isn't allowed for this booking." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) {
    console.error("updateBookingStatus failed:", error);
    return {
      ok: false,
      error: "We couldn't update the booking. Please try again.",
    };
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/customer/dashboard");
  revalidatePath("/worker/dashboard");
  return { ok: true, bookingId };
}
