import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import {
  MapPin,
  Compass,
  BedDouble,
  Sofa,
  LayoutPanelTop,
  Bath,
  Maximize,
  Eye,
  Building2,
  BadgeCheck,
  Phone,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatArea } from "@/lib/utils";
import { Price, DiscountBadge } from "@/components/ui/Price";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { PropertyMap } from "@/components/map/PropertyMap";
import { PropertyLegalStatus } from "@/components/property/PropertyLegalStatus";
import { PropertyAgeBadge } from "@/components/property/PropertyAgeBadge";
import { DealStatusBadge } from "@/components/property/DealStatusActions";
import { NearbyPlaces } from "@/components/property/NearbyPlaces";
import { facadeLabelKey } from "@/components/property/PropertyExtraFields";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";
import { propertySchema, breadcrumbSchema } from "@/lib/structured-data";
import { getSimilarProperties } from "@/lib/queries/properties";
import { categoryLabelKey } from "@/lib/property-categories";
import { PropertyCard } from "@/components/property/PropertyCard";


async function getProperty(id: string) {
  return prisma.property.findFirst({
    where: { id, status: "APPROVED" },
    include: {
      images: { orderBy: { order: "asc" } },
      videos: { orderBy: { order: "asc" } },
      user: { select: { name: true, phone: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const property = await getProperty(id);

  if (!property) return {};

  const t = await getTranslations({ locale });

  const url = `${SITE_URL}/${locale}/properties/${id}`;
  const description = property.description.slice(0, 160);

  // Social platforms do not render SVG previews, so skip the placeholder and
  // fall back to the logo when a listing has no real photo yet.
  const photo = property.images.find((image) => !image.url.endsWith(".svg"));
  const image = photo ? `${SITE_URL}${photo.url}` : `${SITE_URL}/logo.png`;

  return {
    title: `${property.title} — ${t("common.appName")}`,
    description,
    alternates: {
      canonical: url,
      languages: {
        ar: `${SITE_URL}/ar/properties/${id}`,
        en: `${SITE_URL}/en/properties/${id}`,
      },
    },
    openGraph: {
      title: property.title,
      description,
      url,
      type: "website",
      images: [{ url: image, alt: property.title }],
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description,
      images: [image],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [property, t, session] = await Promise.all([
    getProperty(id),
    getTranslations({ locale }),
    getSession(),
  ]);

  if (!property) notFound();

  const isFavorite = session.userId
    ? (await prisma.favorite.findUnique({
        where: {
          userId_propertyId: { userId: session.userId, propertyId: id },
        },
        select: { id: true },
      })) !== null
    : null;

  const similar = await getSimilarProperties(property);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <JsonLd data={propertySchema(property, locale, t("common.appName"))} />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: t("nav.home"), path: "" },
            { name: t("nav.properties"), path: "/properties" },
            { name: property.title, path: `/properties/${property.id}` },
          ],
          locale
        )}
      />
      {/* Back link */}
      <Link
        href="/properties"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-4 min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
        {t("properties.title")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-8">
        {/* Main column */}
        <div>
          <PropertyGallery images={property.images} title={property.title} />

          {/* Title + location */}
          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  property.type === "RENT"
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {t(`property.for${property.type === "RENT" ? "Rent" : "Sale"}`)}
              </span>
              <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                {t(categoryLabelKey(property.category))}
              </span>
              <DealStatusBadge dealStatus={property.dealStatus} />
            </div>

            {/* Someone following an old link deserves to know it is gone */}
            {property.dealStatus && (
              <p className="flex flex-wrap items-center gap-2 mb-3 px-4 py-3 text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-xl">
                {t("deal.noLongerAvailable")}
                <Link
                  href="/properties"
                  className="font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                >
                  {t("deal.browseOthers")}
                </Link>
              </p>
            )}

            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {property.title}
              </h1>
              {isFavorite !== null && (
                <div className="shrink-0 pt-1">
                  <FavoriteButton
                    propertyId={property.id}
                    initialIsFavorite={isFavorite}
                    variant="plain"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-base text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                {property.district}، {property.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                {property.views} {t("property.views")}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                {dateFormatter.format(property.createdAt)}
              </span>
            </div>

            {(property.ageYears !== null || property.facade) && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <PropertyAgeBadge ageYears={property.ageYears} />
                {property.facade && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-full">
                    <Compass className="w-4 h-4" aria-hidden="true" />
                    {t("propertyExtra.facade")}: {t(facadeLabelKey(property.facade))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Key stats */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Maximize
                className="w-5 h-5 mx-auto text-primary mb-1"
                aria-hidden="true"
              />
              <dt className="text-xs text-gray-500">{t("property.area")}</dt>
              <dd className="text-base font-semibold text-gray-900">
                {formatArea(property.area, locale)}
              </dd>
            </div>
            {property.bedrooms > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <BedDouble
                  className="w-5 h-5 mx-auto text-primary mb-1"
                  aria-hidden="true"
                />
                <dt className="text-xs text-gray-500">
                  {t("property.bedrooms")}
                </dt>
                <dd className="text-base font-semibold text-gray-900">
                  {property.bedrooms}
                </dd>
              </div>
            )}
            {property.livingRooms > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Sofa
                  className="w-5 h-5 mx-auto text-primary mb-1"
                  aria-hidden="true"
                />
                <dt className="text-xs text-gray-500">
                  {t("property.livingRooms")}
                </dt>
                <dd className="text-base font-semibold text-gray-900">
                  {property.livingRooms}
                </dd>
              </div>
            )}
            {property.halls > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <LayoutPanelTop
                  className="w-5 h-5 mx-auto text-primary mb-1"
                  aria-hidden="true"
                />
                <dt className="text-xs text-gray-500">
                  {t("property.halls")}
                </dt>
                <dd className="text-base font-semibold text-gray-900">
                  {property.halls}
                </dd>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Bath
                  className="w-5 h-5 mx-auto text-primary mb-1"
                  aria-hidden="true"
                />
                <dt className="text-xs text-gray-500">
                  {t("property.bathrooms")}
                </dt>
                <dd className="text-base font-semibold text-gray-900">
                  {property.bathrooms}
                </dd>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Building2
                className="w-5 h-5 mx-auto text-primary mb-1"
                aria-hidden="true"
              />
              <dt className="text-xs text-gray-500">
                {t("property.category")}
              </dt>
              <dd className="text-base font-semibold text-gray-900">
                {t(categoryLabelKey(property.category))}
              </dd>
            </div>
          </dl>

          {/* Description */}
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {t("property.description")}
            </h2>
            <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </section>

          {property.videos.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t("video.sectionTitle")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.videos.map((video) => (
                  <video
                    key={video.id}
                    src={video.url}
                    poster={video.thumbnailUrl ?? undefined}
                    controls
                    preload="metadata"
                    className="w-full aspect-video rounded-xl bg-gray-900 object-cover border border-gray-200"
                  />
                ))}
              </div>
            </section>
          )}

          <PropertyLegalStatus
            hasRestrictions={property.hasRestrictions}
            hasMortgage={property.hasMortgage}
            hasWaqf={property.hasWaqf}
            hasWill={property.hasWill}
            registryRestrictions={property.registryRestrictions}
            obligations={property.obligations}
          />

          {/* Location — only when the listing was geocoded */}
          {property.latitude !== null && property.longitude !== null && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {t("property.location")}
              </h2>
              <p className="flex items-center gap-1.5 text-base text-gray-600 mb-3">
                <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                {property.district}، {property.city}
              </p>
              <PropertyMap
                compact
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
                properties={[
                  {
                    id: property.id,
                    title: property.title,
                    category: property.category,
                    type: property.type,
                    price: property.price,
                    area: property.area,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    city: property.city,
                    district: property.district,
                    latitude: property.latitude,
                    longitude: property.longitude,
                    publisherType: property.publisherType,
                    dealStatus: property.dealStatus,
                    discountPercent: property.discountPercent,
                    ageYears: property.ageYears,
                    facade: property.facade,
                    images: property.images.slice(0, 1),
                  },
                ]}
              />

              <NearbyPlaces raw={property.nearbyPlaces} />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          {/* Price + contact */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            {/* Publisher sits above the price — the Nafath-verified name, or
                the company's, rather than a generic badge. */}
            <p className="flex items-center gap-1.5 text-sm mb-2">
              {property.publisherType === "COMPANY" ? (
                <Building2
                  className="w-4 h-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
              ) : (
                <BadgeCheck
                  className="w-4 h-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
              )}
              <span className="font-medium text-gray-900">
                {property.user.name}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-primary">
                <Price
                  amount={property.price}
                  discountPercent={property.discountPercent}
                  originalClassName="text-base"
                />
              </span>
              {property.discountPercent ? (
                <DiscountBadge discountPercent={property.discountPercent} />
              ) : null}
            </div>
            {property.type === "RENT" && (
              <p className="text-sm text-gray-500 mb-4">
                / {t("property.perYear")}
              </p>
            )}

            <div className="border-t border-gray-100 pt-4 mt-4">
              <a
                href={`tel:${property.user.phone}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[48px]"
              >
                <Phone className="w-5 h-5" aria-hidden="true" />
                {t("property.callAdvertiser")}
              </a>

              <WhatsAppButton
                phone={property.whatsapp ?? property.user.phone}
                label={t("propertyExtra.whatsappContact")}
                className="mt-2 text-base py-3 min-h-[48px]"
              />

              <p className="text-center text-sm text-gray-500 mt-2" dir="ltr">
                {property.whatsapp ?? property.user.phone}
              </p>
            </div>
          </div>

          {/* Location card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              {t("property.location")}
            </h2>
            <dl className="space-y-2 text-base">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">{t("property.city")}</dt>
                <dd className="font-medium text-gray-900">{property.city}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">{t("property.district")}</dt>
                <dd className="font-medium text-gray-900">
                  {property.district}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Similar listings */}
      {similar.length > 0 && (
        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            {t("property.similarProperties")}
          </h2>
          <p className="text-base text-gray-500 mb-5">
            {t("property.similarPropertiesDesc")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
