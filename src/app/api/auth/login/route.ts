import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";
import { readJsonBody } from "@/lib/api";
import { verifyPassword } from "@/lib/password";
import { startSession, publicUser } from "@/lib/auth-session";

/** Lock the account after this many consecutive failures. */
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

/**
 * POST /api/auth/login — sign in with phone and password.
 *
 * No verification code: the code is only for proving a number at registration
 * and for resetting a forgotten password.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (body.error) return body.error;

    const parsed = loginSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { phone, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { phone } });

    // Unknown number and wrong password are told apart deliberately: the
    // sign-up form already reveals whether a number is registered, so hiding
    // it here would cost usability without buying secrecy.
    if (!user) {
      return NextResponse.json(
        { error: "No account for this number", code: "NO_ACCOUNT" },
        { status: 404 }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );

      return NextResponse.json(
        { error: "Account temporarily locked", code: "LOCKED", minutesLeft },
        { status: 429 }
      );
    }

    // Accounts that predate passwords, or whose owner never set one, are sent
    // down the reset path rather than left with no way in.
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "No password set for this account", code: "NO_PASSWORD" },
        { status: 409 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);

    if (!ok) {
      const failed = user.failedLogins + 1;
      const shouldLock = failed >= MAX_FAILED_LOGINS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: shouldLock ? 0 : failed,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null,
        },
      });

      if (shouldLock) {
        return NextResponse.json(
          {
            error: "Account temporarily locked",
            code: "LOCKED",
            minutesLeft: LOCK_MINUTES,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "Wrong password",
          code: "WRONG_PASSWORD",
          attemptsLeft: MAX_FAILED_LOGINS - failed,
        },
        { status: 401 }
      );
    }

    // A good password clears the counter.
    if (user.failedLogins !== 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
    }

    await startSession(user);

    return NextResponse.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
