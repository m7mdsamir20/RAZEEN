/**
 * Facade labels.
 *
 * Kept out of any `"use client"` module on purpose: the property detail page
 * is a server component and calls this directly. A function exported from a
 * client module cannot be called on the server — it is replaced by a stub that
 * throws, which is a runtime error rather than a build failure.
 */
export function facadeLabelKey(facade: string): string {
  const suffix = facade
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join("");

  return `propertyExtra.facade${suffix}`;
}
