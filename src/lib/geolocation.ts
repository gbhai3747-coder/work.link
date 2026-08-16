/**
 * Browser geolocation helpers. Client-safe (no server imports).
 */

export type GeolocationErrorCode =
  | "permission-denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export interface GeolocationError {
  code: GeolocationErrorCode;
  message: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 0,
};

/**
 * Wraps navigator.geolocation.getCurrentPosition in a Promise.
 * Rejects with a `GeolocationError` on permission/availability/timeout errors.
 */
export function getCurrentPosition(
  options: PositionOptions = DEFAULT_OPTIONS
): Promise<{ coords: Coordinates }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject({
        code: "unsupported",
        message: "Geolocation is not supported by this browser.",
      } satisfies GeolocationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        let code: GeolocationErrorCode;
        if (error.code === error.PERMISSION_DENIED) {
          code = "permission-denied";
        } else if (error.code === error.TIMEOUT) {
          code = "timeout";
        } else {
          code = "unavailable";
        }
        reject({ code, message: error.message } satisfies GeolocationError);
      },
      options
    );
  });
}

export function geolocationErrorMessage(error: GeolocationError): string {
  switch (error.code) {
    case "permission-denied":
      return "Location permission was denied. Allow location access in your browser settings, or search for your address below.";
    case "timeout":
      return "We couldn't get your location in time. Please try again.";
    case "unavailable":
      return "Your location isn't available right now. Please try again or search for your address below.";
    case "unsupported":
      return "Your browser doesn't support location sharing. You can search for your address below instead.";
  }
}
