import "server-only";

import { geoConfig } from "./config";
import { googleProvider } from "./google";
import { mapboxProvider } from "./mapbox";
import { nominatimProvider } from "./nominatim";
import { noneProvider } from "./none";
import type { GeocodeResult, GeoProvider } from "./types";

export type { GeocodeResult, GeoProvider };

/** Returns the configured geocoding provider (never throws). */
export function getGeoProvider(): GeoProvider {
  switch (geoConfig.provider) {
    case "mapbox":
      return mapboxProvider;
    case "google":
      return googleProvider;
    case "nominatim":
      return nominatimProvider;
    default:
      return noneProvider;
  }
}

/** True when a provider is configured with credentials. */
export function mapsConfigured(): boolean {
  return getGeoProvider().isConfigured();
}
