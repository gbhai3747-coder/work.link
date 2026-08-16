"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type NearbyWorker = {
  worker_id: string;
  full_name: string;
  avatar_url: string | null;
  service_name: string;
  description: string | null;
  experience_years: number;
  rating: number;
  completed_jobs: number;
  distance_km: number;
};

export type SearchResult =
  | { workers: NearbyWorker[] }
  | { error: string };

const searchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  serviceSlug: z.string().trim().min(1).max(100),
});

/**
 * Finds available workers offering the selected service near the customer's
 * location. Calls the security-definer RPC `search_nearby_workers`, which only
 * ever returns sanitized public fields + distance — never exact coordinates.
 * Works for anonymous visitors (RPC is granted to anon).
 */
export async function searchNearbyWorkers(input: {
  lat: number;
  lng: number;
  serviceSlug: string;
}): Promise<SearchResult> {
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid search parameters. Please try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_nearby_workers", {
    p_lat: parsed.data.lat,
    p_lng: parsed.data.lng,
    p_service_slug: parsed.data.serviceSlug,
  });

  if (error) {
    console.error("searchNearbyWorkers failed:", error);
    return { error: "We couldn't search for workers right now. Please try again." };
  }

  return { workers: data ?? [] };
}
