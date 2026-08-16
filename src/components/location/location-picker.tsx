"use client";

import { useState } from "react";

import { geocodeAddress, reverseGeocode, type GeocodeResult } from "@/app/actions/geo";
import { useGeolocation } from "@/components/location/use-geolocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Coordinates } from "@/lib/geolocation";

type LocationPickerProps = {
  /** Called with the chosen coordinates, or `null` when the user resets. */
  onLocated: (coords: Coordinates | null) => void;
  /** Currently chosen location (held by the parent). */
  coords?: Coordinates | null;
  /** Whether free-text address geocoding is configured (server-side). */
  mapsEnabled: boolean;
  ctaLabel?: string;
};

export function LocationPicker({
  onLocated,
  coords,
  mapsEnabled,
  ctaLabel = "Use my location",
}: LocationPickerProps) {
  const { state, request, reset, errorMessage } = useGeolocation();
  const [showManual, setShowManual] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);

  const located = coords ?? null;

  const handleLocate = async () => {
    setManualError(null);
    const result = await request();
    if (!result) return;
    onLocated(result);
    if (mapsEnabled) {
      const label = await reverseGeocode(result.lat, result.lng);
      setPlaceLabel(label);
    }
  };

  const handleChange = () => {
    reset();
    setPlaceLabel(null);
    setResults([]);
    onLocated(null);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setManualError(null);
    const res = await geocodeAddress(query);
    setSearching(false);
    if ("error" in res) {
      setManualError(res.error);
      setResults([]);
      return;
    }
    setResults(res.results);
  };

  const handleSelect = (result: GeocodeResult) => {
    onLocated({ lat: result.lat, lng: result.lng });
    setPlaceLabel(result.label);
    setQuery("");
    setResults([]);
    setShowManual(false);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Your location
          </p>
          {located ? (
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
              {placeLabel ?? "Location detected"}
            </p>
          ) : state.status === "locating" ? (
            <p className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
              Getting your location…
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Not shared yet
            </p>
          )}
        </div>

        {located ? (
          <Button variant="outline" size="sm" onClick={handleChange}>
            Change location
          </Button>
        ) : (
          <Button
            size="sm"
            loading={state.status === "locating"}
            onClick={handleLocate}
          >
            {ctaLabel}
          </Button>
        )}
      </div>

      {!located && state.status === "error" && (
        <div className="mt-3">
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          {mapsEnabled && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mt-1"
              onClick={() => setShowManual((v) => !v)}
            >
              {showManual ? "Hide address search" : "Enter address instead"}
            </Button>
          )}
        </div>
      )}

      {!located && showManual && mapsEnabled && (
        <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearch();
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Enter an address or place"
              aria-label="Search address"
              className="min-w-0 flex-1"
            />
            <Button type="submit" loading={searching} className="w-full sm:w-auto">
              Search
            </Button>
          </form>
          {manualError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {manualError}
            </p>
          )}
          {results.length > 0 && (
            <ul className="mt-2 max-h-60 space-y-1 overflow-auto">
              {results.map((result) => (
                <li key={result.label}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {result.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
