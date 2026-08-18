import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { createPropertyRequestSchema } from "@/lib/validations/request";
import { readJsonBody } from "@/lib/api";
import { requiresNafath } from "@/lib/features";
import { notifyAdmins } from "@/lib/notifications";
import {
  getPropertyRequests,
  parseRequestQuery,
} from "@/lib/queries/requests";

/**
 * GET /api/requests — list approved property requests with cursor pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = parseRequestQuery(params);

    const rawLimit = Number(params.limit);
    if (Number.isFinite(rawLimit)) query.limit = rawLimit;

    const { items, nextCursor } = await getPropertyRequests(query);

    return NextResponse.json({ items, nextCursor });
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requests — submit a property request. Requires a signed-in,
 * Nafath verified user; publisher type and status are decided server-side.
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

    const parsed = createPropertyRequestSchema.safeParse({
      ...(body.data as Record<string, unknown>),
      publisherType,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const propertyRequest = await prisma.propertyRequest.create({
      data: {
        ...parsed.data,
        status: publisherType === "COMPANY" ? "APPROVED" : "PENDING",
        userId: session.userId,
      },
    });

    if (propertyRequest.status === "PENDING") {
      after(() =>
        notifyAdmins({
          type: "NEW_REQUEST",
          params: { title: propertyRequest.title },
          link: "/admin/requests?status=PENDING",
        })
      );
    }

    return NextResponse.json({ request: propertyRequest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
