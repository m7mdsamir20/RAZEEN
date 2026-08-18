import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { PropertyGrid } from "@/components/property/PropertyGrid";
import { getProperties, parsePropertyQuery } from "@/lib/queries/properties";
import { getFavoriteIds } from "@/lib/queries/account";
import { getSession } from "@/lib/session";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("properties.title")} — ${t("common.appName")}`,
    description: t("properties.subtitle"),
  };
}

export default async function PropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, resolvedSearchParams, session] = await Promise.all([
    params,
    searchParams,
    getSession(),
  ]);

  const query = parsePropertyQuery(resolvedSearchParams);

  const [t, { items, nextCursor }, favoriteIds] = await Promise.all([
    getTranslations({ locale }),
    getProperties(query),
    getFavoriteIds(session.userId),
  ]);

  // Filters only — the cursor is owned by the grid's load-more state.
  const filterParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (key === "cursor" || value === undefined) continue;
    filterParams.set(key, Array.isArray(value) ? value[0] : value);
  }
  const filterQuery = filterParams.toString();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("properties.title")}
        </h1>
        <p className="text-base text-gray-500">{t("properties.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Suspense
            fallback={
              <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            }
          >
            <PropertyFilters />
          </Suspense>
        </aside>

        <section>
          {/* Remount on filter change so appended pages reset cleanly. */}
          <PropertyGrid
            key={filterQuery}
            initialItems={items}
            initialCursor={nextCursor}
            filterQuery={filterQuery}
            favoriteIds={favoriteIds}
          />
        </section>
      </div>
    </div>
  );
}
