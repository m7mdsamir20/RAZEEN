import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import {
  Inbox,
  MapPin,
  Maximize,
  BadgeCheck,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getAdminProperties } from "@/lib/queries/admin";
import { formatArea } from "@/lib/utils";
import { Price } from "@/components/ui/Price";
import { categoryLabelKey } from "@/lib/categories";
import { ListingStatusBadge } from "@/components/property/ListingStatusBadge";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { StatusFilter } from "@/components/admin/StatusFilter";

const PLACEHOLDER = "/placeholder-property.svg";

const STATUS_OPTIONS = [
  { value: "PENDING", labelKey: "status.pending" },
  { value: "APPROVED", labelKey: "status.approved" },
  { value: "REJECTED", labelKey: "status.rejected" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("admin.nav.properties")} — ${t("common.appName")}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolved] = await Promise.all([params, searchParams]);

  const statusParam = Array.isArray(resolved.status)
    ? resolved.status[0]
    : resolved.status;

  const [t, properties] = await Promise.all([
    getTranslations({ locale }),
    getAdminProperties(statusParam),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div>
      <Suspense
        fallback={<div className="h-11 bg-gray-100 rounded-lg animate-pulse mb-4" />}
      >
        <StatusFilter statuses={STATUS_OPTIONS} />
      </Suspense>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-gray-200 rounded-2xl">
          <Inbox className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t("admin.emptyQueue")}
          </h2>
          <p className="text-base text-gray-500">{t("admin.emptyQueueDesc")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {properties.map((property) => {
            const thumbnail = property.images[0]?.thumbnailUrl || PLACEHOLDER;
            const isCompany = property.publisherType === "COMPANY";

            return (
              <li
                key={property.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  <div className="relative w-full sm:w-40 h-40 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <ListingStatusBadge status={property.status} />
                      <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                        {t(categoryLabelKey(property.category))}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        {dateFormatter.format(property.createdAt)}
                      </span>
                    </div>

                    {property.status === "APPROVED" ? (
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-base font-semibold text-gray-900 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                      >
                        {property.title}
                      </Link>
                    ) : (
                      <h2 className="text-base font-semibold text-gray-900">
                        {property.title}
                      </h2>
                    )}

                    <p className="text-base font-bold text-primary mt-1">
                      <Price amount={property.price} discountPercent={property.discountPercent} />
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        {property.district}، {property.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Maximize className="w-3.5 h-3.5" aria-hidden="true" />
                        {formatArea(property.area, locale)}
                      </span>
                    </div>

                    <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                      {isCompany ? (
                        <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {t("admin.publisher")}: {property.user.name} ·{" "}
                      <span dir="ltr">{property.user.phone}</span>
                    </p>
                  </div>
                </div>

                {property.status === "REJECTED" && property.rejectionReason && (
                  <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border-t border-red-100">
                    <AlertCircle
                      className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold text-red-800">
                        {t("myListings.rejectionReason")}
                      </p>
                      <p className="text-sm text-red-700 mt-0.5">
                        {property.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                  <ModerationActions
                    resource="properties"
                    id={property.id}
                    status={property.status}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
