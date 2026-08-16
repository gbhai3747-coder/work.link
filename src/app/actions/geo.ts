"use server";

import { z } from "zod";

import { getGeoProvider, type GeocodeResult } from "@/lib/geo";
import { coordinatesSchema } from "@/lib/validators";

export type { GeocodeResult };

const addressQuerySchema = z.string().trim().min(2).max(200);

export type GeocodeActionResult =
  | { results: GeocodeResult[] }
  | { error: string };

/**
 * Forward geocoding for the manual location fallback. Always goes through the
 * configured server-side provider; tokens never reach the browser.
 */
export async function geocodeAddress(
  query: string
): Promise<GeocodeActionResult> {
  const parsed = addressQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { error: "Enter a location to search for." };
  }

  const provider = getGeoProvider();
  if (!provider.isConfigured()) {
    return {
      error: "Address search isn't configured yet. Use your location instead.",
    };
  }

  try {
    const results = await provider.geocode(parsed.data);
    return { results };
  } catch (error) {
    console.error("geocodeAddress failed:", error);
    return {
      error: "We couldn't search for that location. Try again or use your location.",
    };
  }
}

const reverseSchema = coordinatesSchema;

/** Best-effort reverse geocoding used only to display a friendly label. */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  const parsed = reverseSchema.safeParse({ lat, lng });
  if (!parsed.success) return null;

  const provider = getGeoProvider();
  if (!provider.isConfigured()) return null;

  try {
    return await provider.reverseGeocode(parsed.data.lat, parsed.data.lng);
  } catch (error) {
    console.error("reverseGeocode failed:", error);
    return null;
  }
}
