import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";

/** GET /api/notifications — the signed-in user's recent notifications. */
export async function GET() {
  try {
    const session = await getSession();

    // Not an error: the header polls this for everyone, signed in or not.
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ items: [], unreadCount: 0 });
    }

    return NextResponse.json(await getNotifications(session.userId));
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** PATCH /api/notifications — mark every notification as read. */
export async function PATCH() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
