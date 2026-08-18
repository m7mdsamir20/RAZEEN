import { regionForCity } from "@/lib/saudi-locations";

/**
 * Server-only Google Maps key.
 *
 * Deliberately not NEXT_PUBLIC: Geocoding and Places cost far more per call
 * than the Maps JavaScript API, so this key never reaches the browser and can
 * be restricted by server IP rather than by HTTP referrer.
 */
const SERVER_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? "";

export function hasServerMapsKey(): boolean {
  return SERVER_KEY.length > 30 && SERVER_KEY.startsWith("AIza");
}

export interface ResolvedAddress {
  formattedAddress: string;
  city: string | null;
  district: string | null;
  region: string | null;
}

interface GeocodeComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/** First component matching any of `types`. */
function pick(
  components: GeocodeComponent[],
  types: string[]
): string | null {
  const match = components.find((c) => types.some((t) => c.types.includes(t)));
  return match ? match.long_name : null;
}

/** Remove the "حي " / "Hayy " prefix Google prepends to district names. */
function stripDistrictPrefix(district: string | null): string | null {
  if (!district) return null;
  return district.replace(/^(حي|حيّ|Hayy|Al Hayy)\s+/i, "").trim() || district;
}

/**
 * Reverse geocode a dropped pin into a Saudi address.
 *
 * Asks Google in Arabic with `region=sa`, so names come back in the same form
 * the rest of the site stores them. Returns null when the key is absent or the
 * lookup fails — the caller keeps whatever the publisher typed.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ResolvedAddress | null> {
  if (!hasServerMapsKey()) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${latitude},${longitude}`);
  url.searchParams.set("language", "ar");
  url.searchParams.set("region", "sa");
  url.searchParams.set("key", SERVER_KEY);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return null;

    const best = data.results[0];
    const components: GeocodeComponent[] = best.address_components ?? [];

    const city = pick(components, ["locality", "administrative_area_level_2"]);

    // Google returns districts as "حي الياسمين"; we store and filter on
    // "الياسمين", so drop the leading word to keep the two comparable.
    const district = stripDistrictPrefix(
      pick(components, ["sublocality_level_1", "sublocality", "neighborhood"])
    );

    // Prefer our own region mapping so the stored value matches the filters.
    const region = city ? (regionForCity(city)?.value ?? null) : null;

    return {
      formattedAddress: best.formatted_address ?? "",
      city,
      district,
      region,
    };
  } catch (error) {
    console.error("reverseGeocode failed:", error);
    return null;
  }
}

export interface NearbyPlace {
  name: string;
  /** Google place category, e.g. "school" or "mosque". */
  type: string;
  /** Straight-line metres from the property. */
  distanceMeters: number;
}

/** Categories worth showing a property seeker, in display order. */
const NEARBY_TYPES = [
  "school",
  "mosque",
  "hospital",
  "supermarket",
  "shopping_mall",
  "park",
  "pharmacy",
] as const;

const NEARBY_RADIUS_METERS = 2000;
const MAX_PER_TYPE = 2;

/** Metres between two coordinates (haversine). */
function distanceBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

/**
 * Landmarks around a property, nearest first.
 *
 * Queries each category separately because Places returns one type per call,
 * and keeps only the closest couple of each so the list stays readable. The
 * result is cached on the property row — Google is asked once per listing,
 * not once per visitor.
 */
export async function fetchNearbyPlaces(
  latitude: number,
  longitude: number
): Promise<NearbyPlace[]> {
  if (!hasServerMapsKey()) return [];

  const requests = NEARBY_TYPES.map(async (type) => {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    );
    url.searchParams.set("location", `${latitude},${longitude}`);
    url.searchParams.set("radius", String(NEARBY_RADIUS_METERS));
    url.searchParams.set("type", type);
    url.searchParams.set("language", "ar");
    url.searchParams.set("key", SERVER_KEY);

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return [];

      const data = await res.json();
      if (data.status !== "OK" || !data.results?.length) return [];

      return (data.results as Record<string, never>[])
        .slice(0, MAX_PER_TYPE)
        .map((place) => {
          const loc = (
            place as unknown as {
              geometry?: { location?: { lat: number; lng: number } };
              name?: string;
            }
          ).geometry?.location;

          return {
            name: (place as unknown as { name?: string }).name ?? "",
            type,
            distanceMeters: loc
              ? distanceBetween(latitude, longitude, loc.lat, loc.lng)
              : NEARBY_RADIUS_METERS,
          };
        })
        .filter((place) => place.name.length > 0);
    } catch (error) {
      console.error(`fetchNearbyPlaces(${type}) failed:`, error);
      return [];
    }
  });

  const results = await Promise.all(requests);

  return results.flat().sort((a, b) => a.distanceMeters - b.distanceMeters);
}
