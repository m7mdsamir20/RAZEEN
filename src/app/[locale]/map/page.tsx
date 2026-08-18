import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MapFilters } from "@/components/map/MapFilters";
import { MapLegend } from "@/components/map/MapLegend";
import { PropertyMap } from "@/components/map/PropertyMap";
import { getMapProperties, parseMapQuery } from "@/lib/queries/map";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("map.title")} — ${t("common.appName")}`,
    description: t("map.subtitle"),
  };
}

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const query = parseMapQuery(resolvedSearchParams);

  const [t, properties] = await Promise.all([
    getTranslations({ locale }),
    getMapProperties(query),
  ]);

  // Remount the map when filters change so it refits to the new markers.
  const filterKey = [query.category, query.type, query.city].join("|");

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 sm:py-8">
      <header className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {t("map.title")}
        </h1>
        <p className="text-base text-gray-500">{t("map.subtitle")}</p>
      </header>

      {/* A narrower rail leaves the map the bulk of a wide screen. */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 lg:gap-5">
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <Suspense
            fallback={
              <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            }
          >
            <MapFilters />
          </Suspense>

          <MapLegend />

          <p className="text-sm text-gray-500 px-1" aria-live="polite">
            {t("map.resultsOnMap", { count: properties.length })}
          </p>
        </aside>

        <section>
          <PropertyMap
            key={filterKey}
            properties={properties}
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
          />
        </section>
      </div>
    </div>
  );
}
