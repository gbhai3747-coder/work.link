import "server-only";

import { geoConfig } from "./config";
import type { GeocodeResult, GeoProvider } from "./types";

const ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

async function request(params: URLSearchParams): Promise<Record<string, unknown>> {
  const url = `${ENDPOINT}?${params.toString()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Google geocoding failed with status ${response.status}`);
  }
  const json = (await response.json()) as {
    status?: string;
    results?: Array<{
      formatted_address?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    }>;
  };
  if (json.status !== "OK") {
    throw new Error(`Google geocoding returned status ${json.status}`);
  }
  return json;
}

export const googleProvider: GeoProvider = {
  name: "google",
  isConfigured: () => Boolean(geoConfig.accessToken),

  async geocode(query) {
    const params = new URLSearchParams({
      address: query,
      key: geoConfig.accessToken,
    });
    const json = (await request(params)) as {
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
    };
    return (json.results ?? [])
      .filter((result) => result.geometry?.location)
      .map((result) => ({
        lat: result.geometry!.location!.lat!,
        lng: result.geometry!.location!.lng!,
        label: result.formatted_address ?? query,
      }));
  },

  async reverseGeocode(lat, lng) {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: geoConfig.accessToken,
    });
    const json = (await request(params)) as {
      results?: Array<{ formatted_address?: string }>;
    };
    return json.results?.[0]?.formatted_address ?? null;
  },
};

export type { GeocodeResult };
