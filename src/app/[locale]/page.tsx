import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { ArrowLeft, Building2, FileText, Plus, Map } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getProperties } from "@/lib/queries/properties";
import { getPropertyRequests } from "@/lib/queries/requests";
import { getFavoriteIds } from "@/lib/queries/account";
import { PropertyCard } from "@/components/property/PropertyCard";
import { RequestCard } from "@/components/request/RequestCard";

const PREVIEW_COUNT = 6;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session] = await Promise.all([params, getSession()]);

  const [t, properties, requests, favoriteIds, stats] = await Promise.all([
    getTranslations({ locale }),
    getProperties({ limit: PREVIEW_COUNT }),
    getPropertyRequests({ limit: PREVIEW_COUNT }),
    getFavoriteIds(session.userId),
    getStats(),
  ]);

  const favoriteSet = favoriteIds ? new Set(favoriteIds) : null;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <Image
          src="/hero-riyadh.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* The photo is bright at the horizon, so the scrim is strongest where
            the text sits and fades toward the skyline. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-primary-dark/85 via-primary-dark/65 to-primary-dark/80"
          aria-hidden="true"
        />

        {/* Desktop gets extra height so the 2.4:1 panorama keeps ~95% of its
            skyline. Mobile takes only the height its content needs — forcing
            a portrait box there would crop the panorama far harder. */}
        <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-24 lg:py-32 lg:min-h-[560px] flex flex-col justify-center text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-sm">
            {t("home.heroTitle")}
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8">
            {t("home.heroSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-10">
            <Link
              href="/properties"
              className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[48px]"
            >
              <Building2 className="w-5 h-5" aria-hidden="true" />
              {t("home.browseAll")}
            </Link>
            <Link
              href="/map"
              className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white border border-white/40 rounded-xl hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none min-h-[48px]"
            >
              <Map className="w-5 h-5" aria-hidden="true" />
              {t("home.exploreMap")}
            </Link>
          </div>

          {/* Stats */}
          <dl className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {[
              { value: stats.properties, labelKey: "home.statProperties" },
              { value: stats.requests, labelKey: "home.statRequests" },
              { value: stats.cities, labelKey: "home.statCities" },
            ].map(({ value, labelKey }) => (
              <div key={labelKey}>
                <dd className="text-2xl sm:text-3xl font-bold text-white">
                  {value}
                </dd>
                <dt className="text-sm text-white/70">{t(labelKey)}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12 space-y-12">
        {/* Listed properties */}
        <Section
          title={t("home.latestProperties")}
          description={t("home.latestPropertiesDesc")}
          href="/properties"
          linkLabel={t("home.viewAllProperties")}
          isEmpty={properties.items.length === 0}
          emptyLabel={t("home.noProperties")}
          Icon={Building2}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {properties.items.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorite={
                  favoriteSet ? favoriteSet.has(property.id) : undefined
                }
              />
            ))}
          </div>
        </Section>

        {/* Requested properties */}
        <Section
          title={t("home.latestRequests")}
          description={t("home.latestRequestsDesc")}
          href="/requests"
          linkLabel={t("home.viewAllRequests")}
          isEmpty={requests.items.length === 0}
          emptyLabel={t("home.noRequests")}
          Icon={FileText}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {requests.items.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </Section>

        {/* CTA */}
        <section className="bg-primary text-white rounded-2xl p-6 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-base text-white/80 mb-6 max-w-md mx-auto">
            {t("home.ctaDesc")}
          </p>
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-primary bg-white rounded-xl hover:bg-white/90 transition-colors focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none min-h-[48px]"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            {t("home.ctaButton")}
          </Link>
        </section>
      </div>
    </>
  );
}

/** Counts shown in the hero. */
async function getStats() {
  const [properties, requests, cities] = await Promise.all([
    prisma.property.count({ where: { status: "APPROVED", dealStatus: null } }),
    prisma.propertyRequest.count({ where: { status: "APPROVED" } }),
    prisma.property.findMany({
      where: { status: "APPROVED", dealStatus: null },
      select: { city: true },
      distinct: ["city"],
    }),
  ]);

  return { properties, requests, cities: cities.length };
}

function Section({
  title,
  description,
  href,
  linkLabel,
  isEmpty,
  emptyLabel,
  Icon,
  children,
}: {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  isEmpty: boolean;
  emptyLabel: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {title}
          </h2>
          <p className="text-base text-gray-500 mt-0.5">{description}</p>
        </div>

        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded py-2"
        >
          {linkLabel}
          <ArrowLeft
            className="w-4 h-4 rtl:rotate-0 ltr:rotate-180"
            aria-hidden="true"
          />
        </Link>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 border border-gray-200 rounded-2xl">
          <Icon className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
          <p className="text-base text-gray-500">{emptyLabel}</p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
