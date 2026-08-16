export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

export interface GeoProvider {
  /** Stable identifier, used in logs and to gate UI features. */
  name: "mapbox" | "google" | "nominatim" | "none";
  /** Whether the provider has the credentials needed to actually geocode. */
  isConfigured(): boolean;
  /** Forward geocoding: free-text address/place -> coordinates. */
  geocode(query: string): Promise<GeocodeResult[]>;
  /** Reverse geocoding: coordinates -> a human readable label. */
  reverseGeocode(lat: number, lng: number): Promise<string | null>;
}
