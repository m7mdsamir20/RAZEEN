import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function POST() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isNafathVerified) {
      return NextResponse.json(
        { error: "Already verified" },
        { status: 400 }
      );
    }

    // Simulate Nafath verification (in production, integrate with Nafath API)
    await prisma.user.update({
      where: { id: session.userId },
      data: { isNafathVerified: true },
    });

    // Update session
    session.isNafathVerified = true;
    await session.save();

    console.log(`\n✅ Nafath verified for user ${session.userId}\n`);

    return NextResponse.json({
      success: true,
      message: "Nafath verification successful",
    });
  } catch (error) {
    console.error("Nafath verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
