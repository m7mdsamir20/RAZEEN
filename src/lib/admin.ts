import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Session role is set at login from the database and never from the request,
 * so it is safe to authorise against directly.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isLoggedIn && session.role === "COMPANY_ADMIN";
}

/**
 * Guard for admin route handlers. Returns the admin's session, or a response
 * to return immediately.
 *
 * Unauthenticated callers get 401; signed-in non-admins get 404 rather than
 * 403, so the admin surface does not confirm its own existence to them.
 */
export async function requireAdmin(): Promise<
  | { session: Awaited<ReturnType<typeof getSession>>; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.role !== "COMPANY_ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  return { session, error: null };
}
