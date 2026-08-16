"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  searchNearbyWorkers,
  type NearbyWorker,
} from "@/app/actions/search";
import { LocationPicker } from "@/components/location/location-picker";
import { Alert } from "@/components/ui/alert";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { WorkerCard } from "@/components/workers/worker-card";
import { WorkerCardSkeleton } from "@/components/workers/worker-card-skeleton";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/lib/geolocation";

export type ServiceOption = {
  id: string;
  name: string;
  slug: string;
};

type SearchStatus = "idle" | "loading" | "success" | "error";

const STORAGE_KEY = "worklink:customer-location";

function readSessionLocation(): Coordinates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown };
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      parsed.lat >= -90 &&
      parsed.lat <= 90 &&
      parsed.lng >= -180 &&
      parsed.lng <= 180
    ) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {
    // Ignore malformed stored data.
  }
  return null;
}

export function FindWorkersClient({
  services,
  initialServiceSlug,
  mapsEnabled,
}: {
  services: ServiceOption[];
  initialServiceSlug?: string;
  mapsEnabled: boolean;
}) {
  const initialSlug = useMemo(
    () =>
      initialServiceSlug && services.some((s) => s.slug === initialServiceSlug)
        ? initialServiceSlug
        : null,
    [services, initialServiceSlug]
  );

  const [selectedService, setSelectedService] = useState<string | null>(
    initialSlug
  );
  // Coords start null so the first (SSR) render matches the server HTML; a
  // location shared earlier in this session is restored just after mount.
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [workers, setWorkers] = useState<NearbyWorker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const restoredRef = useRef(false);

  // Restore a location shared earlier in this session (sessionStorage only —
  // never persisted across sessions). Runs after hydration to avoid mismatches.
  useEffect(() => {
    if (typeof window === "undefined" || restoredRef.current) return;
    restoredRef.current = true;
    const timer = window.setTimeout(() => {
      const stored = readSessionLocation();
      if (!stored) return;
      setCoords(stored);
      if (initialSlug) setStatus("loading");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialSlug]);

  // Run a search whenever both a service and a location are available. State
  // is only updated asynchronously (after the server action resolves).
  useEffect(() => {
    if (!selectedService || !coords) return;
    let cancelled = false;
    void searchNearbyWorkers({
      lat: coords.lat,
      lng: coords.lng,
      serviceSlug: selectedService,
    }).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setStatus("error");
        setError(result.error);
      } else {
        setWorkers(result.workers);
        setStatus("success");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedService, coords, retryKey]);

  const handleServiceSelect = (slug: string) => {
    setSelectedService(slug);
    if (coords) setStatus("loading");
  };

  const handleLocated = (location: Coordinates | null) => {
    setCoords(location);
    try {
      if (location) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      } else {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures.
    }
    if (location && selectedService) {
      setStatus("loading");
    } else if (!location) {
      setStatus("idle");
      setWorkers([]);
    }
  };

  const retry = () => {
    if (selectedService && coords) {
      setStatus("loading");
      setRetryKey((key) => key + 1);
    } else {
      setStatus("idle");
    }
  };

  const selectedServiceName = useMemo(
    () => services.find((s) => s.slug === selectedService)?.name,
    [services, selectedService]
  );

  const canSearch = Boolean(selectedService && coords);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <BackButton className="mb-4" />
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
        Find a worker nearby
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Choose a service, share your location, and see available workers sorted
        by distance.
      </p>

      <div className="mt-8">
        <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            1
          </span>
          Pick a service
        </p>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => handleServiceSelect(service.slug)}
              aria-pressed={selectedService === service.slug}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                selectedService === service.slug
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                  : "border-zinc-300 bg-white text-zinc-700 hover:-translate-y-px hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
              )}
            >
              {service.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            2
          </span>
          Share your location
        </p>
        <LocationPicker
          onLocated={handleLocated}
          coords={coords}
          mapsEnabled={mapsEnabled}
        />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            3
          </span>
          Available workers
        </p>

        {status === "idle" && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
                <path d="M8 11h6M11 8v6" />
              </svg>
            </span>
            <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {selectedService && !coords
                ? "Ready when you are"
                : "Get started"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              {selectedService && !coords
                ? "Select “Use my location” to see workers near you."
                : "Pick a service category above to get started."}
            </p>
          </div>
        )}

        {status === "loading" && <WorkerCardSkeleton count={3} />}

        {status === "error" && (
          <div className="space-y-3">
            <Alert message={error} />
            {canSearch && (
              <Button variant="outline" onClick={retry}>
                Retry
              </Button>
            )}
          </div>
        )}

        {status === "success" && workers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/60 px-4 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              No available workers nearby
              {selectedServiceName ? ` for ${selectedServiceName}` : ""} right
              now
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Try another category, or check back later — workers update their
              location when they go online.
            </p>
          </div>
        )}

        {status === "success" && workers.length > 0 && (
          <>
            <p className="mb-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              {workers.length} worker{workers.length === 1 ? "" : "s"} near you
            </p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => (
                <WorkerCard key={worker.worker_id} worker={worker} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
