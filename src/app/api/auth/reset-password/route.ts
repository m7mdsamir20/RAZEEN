import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { readJsonBody } from "@/lib/api";
import { hashPassword } from "@/lib/password";
import { consumeOtp } from "@/lib/otp";
import { startSession, publicUser } from "@/lib/auth-session";

/**
 * POST /api/auth/reset-password — set a new password using a verification code.
 *
 * This is the only way back in for someone who has forgotten their password,
 * and the only way in for an account that never had one. A successful reset
 * also clears any lockout, since whoever holds the phone has now proven it.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = resetPasswordSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone, code, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return NextResponse.json(
        { error: "No account for this number", code: "NO_ACCOUNT" },
        { status: 404 }
      );
    }

    const otp = await consumeOtp(phone, code);

    if (!otp.ok) {
      return NextResponse.json(
        { error: otp.error, code: otp.code },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    await startSession(updated);

    return NextResponse.json({ success: true, user: publicUser(updated) });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
