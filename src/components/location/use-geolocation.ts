"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCurrentPosition,
  geolocationErrorMessage,
  type Coordinates,
  type GeolocationError,
} from "@/lib/geolocation";

export type LocationState =
  | { status: "idle"; coords: null; error: null }
  | { status: "locating"; coords: null; error: null }
  | { status: "success"; coords: Coordinates; error: null }
  | { status: "error"; coords: null; error: GeolocationError };

/**
 * React wrapper around the browser Geolocation API.
 * Location is only requested when `request()` is called (e.g. on a user click).
 */
export function useGeolocation() {
  const [state, setState] = useState<LocationState>({
    status: "idle",
    coords: null,
    error: null,
  });
  const inFlight = useRef(false);

  const request = useCallback(async (): Promise<Coordinates | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setState({ status: "locating", coords: null, error: null });
    try {
      const { coords } = await getCurrentPosition();
      setState({ status: "success", coords, error: null });
      return coords;
    } catch (error) {
      setState({
        status: "error",
        coords: null,
        error: error as GeolocationError,
      });
      return null;
    } finally {
      inFlight.current = false;
    }
  }, []);

  const setCoords = useCallback((coords: Coordinates) => {
    setState({ status: "success", coords, error: null });
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", coords: null, error: null });
  }, []);

  const errorMessage =
    state.status === "error" ? geolocationErrorMessage(state.error) : null;

  useEffect(() => () => void (inFlight.current = false), []);

  return { state, request, setCoords, reset, errorMessage };
}
