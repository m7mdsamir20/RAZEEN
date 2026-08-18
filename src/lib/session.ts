import { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  phone?: string;
  name?: string;
  isLoggedIn: boolean;
  isNafathVerified: boolean;
  role?: "USER" | "COMPANY_ADMIN";
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
  isNafathVerified: false,
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "change-this-to-a-random-string-at-least-32-characters-long-ok",
  cookieName: "razeem-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

/**
 * Get the current session from cookies (Server Components & Route Handlers).
 */
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  // Ensure defaults
  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
    session.isNafathVerified = defaultSession.isNafathVerified;
  }

  return session;
}
