import "server-only";

import { geoConfig } from "./config";
import type { GeocodeResult, GeoProvider } from "./types";

const ENDPOINT = "https://api.mapbox.com/geocoding/v5/mapbox.places";

async function request(path: string): Promise<Record<string, unknown>> {
  const url = `${ENDPOINT}/${encodeURIComponent(path)}.json?access_token=${encodeURIComponent(
    geoConfig.accessToken
  )}&limit=5`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed with status ${response.status}`);
  }
  return response.json();
}

export const mapboxProvider: GeoProvider = {
  name: "mapbox",
  isConfigured: () => Boolean(geoConfig.accessToken),

  async geocode(query) {
    const json = await request(query);
    const features = Array.isArray(json?.features)
      ? (json.features as Array<{
          center?: number[];
          place_name?: string;
        }>)
      : [];
    return features
      .filter((feature) => feature.center?.length === 2)
      .map((feature) => ({
        lat: feature.center![1],
        lng: feature.center![0],
        label: feature.place_name ?? query,
      }));
  },

  async reverseGeocode(lat, lng) {
    const json = await request(`${lng},${lat}`);
    const features = Array.isArray(json?.features)
      ? (json.features as Array<{ place_name?: string }>)
      : [];
    return features[0]?.place_name ?? null;
  },
};

export type { GeocodeResult };
