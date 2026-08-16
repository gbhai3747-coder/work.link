import "server-only";

export type MapsProviderName = "mapbox" | "google" | "nominatim" | "none";

/**
 * Server-only maps configuration. Read from environment variables so the app
 * works without any paid provider: with "none" the app still supports browser
 * geolocation + nearby-worker search, just not free-text address geocoding.
 * Defaults to "nominatim" (OpenStreetMap), which is free and needs no API key,
 * so reverse geocoding shows a readable address out of the box.
 */
export const geoConfig = {
  provider: (process.env.MAPS_PROVIDER ?? "nominatim") as MapsProviderName,
  accessToken: process.env.MAPS_ACCESS_TOKEN ?? "",
} as const;
