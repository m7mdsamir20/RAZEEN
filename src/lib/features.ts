/**
 * Feature switches read from the environment.
 */

/**
 * Whether publishing a listing or a request requires Nafath verification.
 *
 * Off until the Nafath integration is approved and its API is available.
 * While off, any signed-in user can publish and the verification prompts stay
 * hidden — the `isNafathVerified` column and the simulated endpoint are left
 * in place, so switching this back on restores the gate without a rewrite.
 *
 * Enable with REQUIRE_NAFATH=true (and NEXT_PUBLIC_REQUIRE_NAFATH=true, which
 * the client components read).
 */
export function requiresNafath(): boolean {
  return process.env.REQUIRE_NAFATH === "true";
}

/**
 * Client-side counterpart. Must be a direct `process.env.X` reference so the
 * bundler can inline it — a computed lookup would resolve to undefined.
 */
export const REQUIRES_NAFATH_CLIENT =
  process.env.NEXT_PUBLIC_REQUIRE_NAFATH === "true";
