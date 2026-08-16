import "server-only";

export type MapsProviderName = "mapbox" | "google" | "nominatim" | "none";

/**
 * Server-only maps configuration. Read from environment variables so the app
 * works without any paid provider: with "none" the app still supports browser
 * geolocation + nearby-worker search, just not free-text address geocoding.
 * "nominatim" (OpenStreetMap) is free and needs no API key.
 */
export const geoConfig = {
  provider: (process.env.MAPS_PROVIDER ?? "none") as MapsProviderName,
  accessToken: process.env.MAPS_ACCESS_TOKEN ?? "",
} as const;
