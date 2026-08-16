import "server-only";

import type { GeoProvider } from "./types";

/**
 * No-op provider used when no maps provider is configured. The app still works
 * with browser geolocation + nearby-worker search; only free-text address
 * geocoding is unavailable.
 */
export const noneProvider: GeoProvider = {
  name: "none",
  isConfigured: () => false,

  async geocode() {
    throw new Error("No maps provider is configured.");
  },

  async reverseGeocode() {
    return null;
  },
};
