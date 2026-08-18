import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { hasServerMapsKey, reverseGeocode } from "@/lib/google-maps-server";

/**
 * GET /api/geocode?lat=&lng= — resolve a dropped pin into a Saudi address.
 *
 * Sits behind a session because each call costs money; only someone who can
 * actually publish a listing can spend it. Returns `available: false` rather
 * than an error when no server key is configured, so the form can degrade to
 * manual entry without showing a failure.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate the input before the key check, so a malformed request is a
    // 400 whether or not geocoding happens to be configured.
    const { searchParams } = request.nextUrl;
    const rawLat = searchParams.get("lat");
    const rawLng = searchParams.get("lng");

    // Number(null) is 0, which would silently geocode the Gulf of Guinea —
    // require the params to actually be present.
    const lat = rawLat === null ? NaN : Number(rawLat);
    const lng = rawLng === null ? NaN : Number(rawLng);

    const isValid =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    if (!hasServerMapsKey()) {
      return NextResponse.json({ available: false, address: null });
    }

    const address = await reverseGeocode(lat, lng);

    return NextResponse.json({ available: true, address });
  } catch (error) {
    console.error("GET /api/geocode error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
