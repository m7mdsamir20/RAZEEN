import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readJsonBody } from "@/lib/api";
import { createManagementRequestSchema } from "@/lib/validations/request";
import { notifyAdmins } from "@/lib/notifications";

/**
 * POST /api/management — submit a property-management enquiry.
 *
 * Requires a signed-in user so the enquiry has an owner the team can follow
 * up with, but not Nafath: this is a lead, not a public listing.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = createManagementRequestSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const managementRequest = await prisma.managementRequest.create({
      data: {
        ...parsed.data,
        // `notes` is optional in the form; store null rather than "".
        notes: parsed.data.notes?.trim() || null,
        userId: session.userId,
      },
    });

    after(() =>
      notifyAdmins({
        type: "NEW_MANAGEMENT",
        params: { name: managementRequest.ownerName },
        link: "/admin/management?status=NEW",
      })
    );

    return NextResponse.json({ request: managementRequest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/management error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
