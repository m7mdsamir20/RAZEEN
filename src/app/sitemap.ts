import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

/** Public routes that exist in both locales. */
const STATIC_PATHS = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/properties", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/map", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/requests", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/marketing", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/management", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
];

/**
 * Every locale of a page points at its siblings through `alternates.languages`,
 * so search engines treat them as translations rather than duplicates.
 */
function languageAlternates(path: string) {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of STATIC_PATHS) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: { languages: languageAlternates(path) },
      });
    }
  }

  // Approved listings only — pending and rejected ones are not public.
  const properties = await prisma.property.findMany({
    where: { status: "APPROVED", dealStatus: null },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  for (const property of properties) {
    const path = `/properties/${property.id}`;
    for (const locale of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: property.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: { languages: languageAlternates(path) },
      });
    }
  }

  return entries;
}
