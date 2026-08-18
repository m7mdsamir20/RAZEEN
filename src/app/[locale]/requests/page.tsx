import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RequestFilters } from "@/components/request/RequestFilters";
import { RequestGrid } from "@/components/request/RequestGrid";
import {
  getPropertyRequests,
  parseRequestQuery,
} from "@/lib/queries/requests";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("requests.title")} — ${t("common.appName")}`,
    description: t("requests.subtitle"),
  };
}

export default async function RequestsPage({
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

  const t = await getTranslations({ locale });

  const query = parseRequestQuery(resolvedSearchParams);
  const { items, nextCursor } = await getPropertyRequests(query);

  const filterParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (key === "cursor" || value === undefined) continue;
    filterParams.set(key, Array.isArray(value) ? value[0] : value);
  }
  const filterQuery = filterParams.toString();

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {t("requests.title")}
          </h1>
          <p className="text-base text-gray-500">{t("requests.subtitle")}</p>
        </div>

        <Link
          href="/requests/new"
          className="flex items-center justify-center gap-2 px-5 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[48px] shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          {t("requests.addRequest")}
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Suspense
            fallback={
              <div className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            }
          >
            <RequestFilters />
          </Suspense>
        </aside>

        <section>
          {/* Remount on filter change so appended pages reset cleanly. */}
          <RequestGrid
            key={filterQuery}
            initialItems={items}
            initialCursor={nextCursor}
            filterQuery={filterQuery}
          />
        </section>
      </div>
    </div>
  );
}
