import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createPropertySchema } from "@/lib/validations/property";
import { notifyAdmins } from "@/lib/notifications";
import { readJsonBody } from "@/lib/api";
import { requiresNafath } from "@/lib/features";
import { getProperties, parsePropertyQuery } from "@/lib/queries/properties";
import { fetchNearbyPlaces } from "@/lib/google-maps-server";

/**
 * Look up landmarks and store them on the listing. Runs detached from the
 * request so publishing is not held up by Google's latency; any failure is
 * logged and the listing simply has no cached landmarks.
 */
async function cacheNearbyPlaces(
  propertyId: string,
  latitude: number,
  longitude: number
) {
  try {
    const places = await fetchNearbyPlaces(latitude, longitude);
    if (places.length === 0) return;

    await prisma.property.update({
      where: { id: propertyId },
      data: { nearbyPlaces: JSON.stringify(places) },
    });
  } catch (error) {
    console.error("cacheNearbyPlaces failed:", error);
  }
}

/**
 * GET /api/properties — list approved properties with filters and cursor
 * pagination. Backs the grid's "load more"; the first page is server-rendered.
 */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = parsePropertyQuery(params);

    const rawLimit = Number(params.limit);
    if (Number.isFinite(rawLimit)) query.limit = rawLimit;

    const { items, nextCursor } = await getProperties(query);

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("GET /api/properties error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/properties — create a listing. Requires a signed-in, Nafath
 * verified user. The publisher type and initial status are decided by the
 * server, never by the request body.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Gated behind a flag until the Nafath integration goes live.
    if (requiresNafath() && !session.isNafathVerified) {
      return NextResponse.json(
        { error: "Nafath verification required" },
        { status: 403 }
      );
    }

    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const publisherType =
      session.role === "COMPANY_ADMIN" ? "COMPANY" : "VERIFIED_USER";

    const parsed = createPropertySchema.safeParse({
      ...(body.data as Record<string, unknown>),
      publisherType,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        ...parsed.data,
        // Company listings skip review; user listings await admin approval.
        status: publisherType === "COMPANY" ? "APPROVED" : "PENDING",
        userId: session.userId,
      },
    });

    // A listing that skips review needs no moderator's attention.
    if (property.status === "PENDING") {
      after(() =>
        notifyAdmins({
          type: "NEW_PROPERTY",
          params: { title: property.title },
          link: "/admin/properties?status=PENDING",
        })
      );
    }

    // Landmarks are looked up once, here, and stored on the row — asking
    // Google on every page view would be slow and expensive.
    //
    // `after` keeps the work alive past the response; a bare floating promise
    // gets dropped when the request context tears down.
    if (property.latitude !== null && property.longitude !== null) {
      const { id, latitude, longitude } = property;
      after(() => cacheNearbyPlaces(id, latitude, longitude));
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (error) {
    console.error("POST /api/properties error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
