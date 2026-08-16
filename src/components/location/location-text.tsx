"use client";

import { useLocationLabel } from "@/components/location/use-location-label";

/**
 * Displays a human-readable address for a pair of coordinates. Shows a brief
 * "Getting address…" while reverse geocoding, then the resolved address or a
 * friendly "Location detected" fallback. Raw coordinates are never shown.
 */
export function LocationText({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const label = useLocationLabel(lat, lng);

  if (label.status === "loading") {
    return <span>Getting address…</span>;
  }

  return (
    <span>
      {label.status === "ready" ? label.label : "Location detected"}
    </span>
  );
}
