import "server-only";

import type { GeocodeResult, GeoProvider } from "./types";

const ENDPOINT = "https://nominatim.openstreetmap.org";

// Nominatim usage policy requires at most ~1 request per second and asks apps
// to identify themselves. See:
// https://operations.osmfoundation.org/policies/nominatim/
const MIN_INTERVAL_MS = 1000;
const CACHE_LIMIT = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const HEADERS = {
  "User-Agent": "Worklink/1.0 (local-services marketplace; contact: support@worklink.app)",
  "Accept-Language": "en",
} as const;

type CacheEntry = { createdAt: number; value: unknown };

const cache = new Map<string, CacheEntry>();

// Serialises every Nominatim request so at least MIN_INTERVAL_MS elapses
// between API calls, even with concurrent users/hooks.
let lastRequestAt = 0;
let queueTail: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queueTail.then(async () => {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_INTERVAL_MS - elapsed)
      );
    }
    lastRequestAt = Date.now();
    return task();
  });
  queueTail = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function readCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function writeCache<T>(key: string, value: T): void {
  cache.set(key, { createdAt: Date.now(), value });
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

async function fetchJson(
  path: "search" | "reverse",
  params: URLSearchParams
): Promise<unknown> {
  const url = `${ENDPOINT}/${path}?${params.toString()}`;
  const response = await fetch(url, {
    headers: HEADERS,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `Nominatim ${path} geocoding failed with status ${response.status}`
    );
  }
  return response.json();
}

export const nominatimProvider: GeoProvider = {
  name: "nominatim",
  // No API key or account needed; Nominatim is always available when selected.
  isConfigured: () => true,

  async geocode(query) {
    const cacheKey = `f:${query.toLowerCase()}`;
    const cached = readCache<GeocodeResult[]>(cacheKey);
    if (cached) return cached;

    return enqueue(async () => {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "5",
      });
      const json = (await fetchJson("search", params)) as Array<{
        lat?: string;
        lon?: string;
        display_name?: string;
      }>;
      const results = json
        .filter((result) => result.lat != null && result.lon != null)
        .map((result) => ({
          lat: Number(result.lat),
          lng: Number(result.lon),
          label: result.display_name ?? query,
        }));
      writeCache(cacheKey, results);
      return results;
    });
  },

  async reverseGeocode(lat, lng) {
    const cacheKey = `r:${lat.toFixed(6)},${lng.toFixed(6)}`;
    const cached = readCache<string | null>(cacheKey);
    if (cached !== null) return cached;

    return enqueue(async () => {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "jsonv2",
        addressdetails: "1",
      });
      const json = (await fetchJson("reverse", params)) as {
        display_name?: string;
        error?: string;
      };
      const label =
        typeof json.display_name === "string" ? json.display_name : null;
      writeCache(cacheKey, label);
      return label;
    });
  },
};

export type { GeocodeResult };
