import { getSession } from "@/lib/session";

interface SessionUser {
  id: string;
  name: string;
  phone: string;
  isNafathVerified: boolean;
  role: string;
}

/**
 * Sign a user in. Every route that ends with an authenticated visitor goes
 * through here, so the session carries the same fields whichever door was
 * used — sign-in, registration or a password reset.
 */
export async function startSession(user: SessionUser) {
  const session = await getSession();

  session.userId = user.id;
  session.phone = user.phone;
  session.name = user.name;
  session.isLoggedIn = true;
  session.isNafathVerified = user.isNafathVerified;
  session.role = user.role as "USER" | "COMPANY_ADMIN";

  await session.save();
}

/** The shape returned to the client after any successful authentication. */
export function publicUser(user: SessionUser) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    isNafathVerified: user.isNafathVerified,
    role: user.role,
  };
}
