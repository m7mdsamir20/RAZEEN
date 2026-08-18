import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({
        isLoggedIn: false,
        isNafathVerified: false,
      });
    }

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn,
      userId: session.userId,
      name: session.name,
      phone: session.phone,
      isNafathVerified: session.isNafathVerified,
      role: session.role,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json(
      { isLoggedIn: false, isNafathVerified: false },
      { status: 500 }
    );
  }
}
