import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private surfaces: the dashboard, the API, and per-user pages.
      disallow: [
        "/api/",
        "/ar/admin",
        "/en/admin",
        "/ar/profile",
        "/en/profile",
        "/ar/my-listings",
        "/en/my-listings",
        "/ar/favorites",
        "/en/favorites",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
