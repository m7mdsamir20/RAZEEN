import path from "node:path";

/**
 * Where uploaded photos and videos live, and how they are addressed.
 *
 * They must not live inside the built application. Hosting that deploys each
 * release into its own directory — Hostinger builds into
 * `hbuilds/versions/<id>/` — starts every release with an empty `public/`, so
 * anything written there disappears the next time the site is deployed.
 *
 * Set `UPLOADS_DIR` to a path outside the project, for example
 * `/home/<account>/uploads`. Without it, uploads fall back to `public/uploads`,
 * which is fine for local development.
 */
export const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR?.trim() ||
    path.join(process.cwd(), "public", "uploads")
);

/**
 * Public prefix for stored files. Served by the route handler at
 * `src/app/media/[...path]/route.ts` rather than as a static asset, because
 * the directory above is outside anything the web server exposes directly.
 */
export const MEDIA_URL_PREFIX = "/media";

/** Absolute directory holding one property's files. */
export function propertyMediaDir(propertyId: string): string {
  return path.join(UPLOADS_DIR, "properties", propertyId);
}

/** Public URL for a file inside a property's directory. */
export function propertyMediaUrl(propertyId: string, fileName: string): string {
  return `${MEDIA_URL_PREFIX}/properties/${propertyId}/${fileName}`;
}

/**
 * Resolve a request path to a file on disk, or null when it escapes the
 * uploads directory. `..` segments survive URL decoding, so the resolved path
 * is compared against the base rather than the raw string.
 */
export function resolveMediaPath(segments: string[]): string | null {
  const target = path.resolve(UPLOADS_DIR, ...segments);

  if (target !== UPLOADS_DIR && !target.startsWith(UPLOADS_DIR + path.sep)) {
    return null;
  }

  return target;
}
