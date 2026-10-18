import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
  },
  experimental: {
    // Trades a little build time for a lower peak heap. The shared hosting
    // that builds this project has very little memory to spare.
    webpackMemoryOptimizations: true,
  },
};

export default withNextIntl(nextConfig);
