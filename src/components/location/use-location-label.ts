"use client";

import { useEffect, useState } from "react";

import { reverseGeocode } from "@/app/actions/geo";

export type LocationLabel =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "ready"; label: string };

const FALLBACK = "Location detected";

/**
 * Resolves coordinates to a human-readable address via the server-side
 * reverse-geocoding provider. Gracefully falls back to "Location detected"
 * when geocoding is unavailable or fails, so the UI never shows raw
 * coordinates or an error.
 */
export function useLocationLabel(
  lat: number | null | undefined,
  lng: number | null | undefined
): LocationLabel {
  const [resolved, setResolved] = useState<{ key: string; label: string } | null>(
    null
  );
  const coordsKey =
    lat != null && lng != null ? `${lat.toFixed(6)},${lng.toFixed(6)}` : null;

  useEffect(() => {
    if (coordsKey == null) {
      return;
    }
    let cancelled = false;
    reverseGeocode(lat!, lng!).then((label) => {
      if (!cancelled) {
        setResolved({ key: coordsKey, label: label ?? FALLBACK });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng, coordsKey]);

  if (coordsKey == null) {
    return { status: "empty" };
  }
  if (resolved?.key !== coordsKey) {
    return { status: "loading" };
  }
  return { status: "ready", label: resolved.label };
}
