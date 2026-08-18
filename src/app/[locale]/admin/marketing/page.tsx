import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  Inbox,
  MapPin,
  Phone,
  User,
  Calendar,
  Home,
  Maximize,
  Wallet,
  StickyNote,
  MessageCircle,
} from "lucide-react";
import { getAdminMarketingRequests } from "@/lib/queries/admin";
import { ManagementActions } from "@/components/admin/ModerationActions";
import { StatusFilter } from "@/components/admin/StatusFilter";
import { Price } from "@/components/ui/Price";
import { formatArea } from "@/lib/utils";
import { categoryLabelKey } from "@/lib/property-categories";
import { whatsappHref } from "@/components/ui/WhatsAppButton";

const STATUS_OPTIONS = [
  { value: "NEW", labelKey: "admin.marketingStatus.NEW" },
  { value: "CONTACTED", labelKey: "admin.marketingStatus.CONTACTED" },
  { value: "CLOSED", labelKey: "admin.marketingStatus.CLOSED" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-primary/10 text-primary border-primary/20",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  CLOSED: "bg-gray-100 text-gray-600 border-gray-200",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("admin.nav.marketing")} — ${t("common.appName")}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminMarketingPage({
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

  const [t, requests] = await Promise.all([
    getTranslations({ locale }),
    getAdminMarketingRequests(statusParam),
  ]);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <div>
      <Suspense
        fallback={
          <div className="h-11 bg-gray-100 rounded-lg animate-pulse mb-4" />
        }
      >
        <StatusFilter statuses={STATUS_OPTIONS} />
      </Suspense>

      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-gray-200 rounded-2xl">
          <Inbox className="w-8 h-8 text-gray-300 mb-2" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t("admin.emptyQueue")}
          </h2>
          <p className="text-base text-gray-500">{t("admin.emptyQueueDesc")}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li
              key={request.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
            >
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`px-3 py-1 text-xs font-medium border rounded-full ${
                      STATUS_STYLES[request.status] ?? STATUS_STYLES.NEW
                    }`}
                  >
                    {t(`admin.marketingStatus.${request.status}`)}
                  </span>
                  <span className="px-3 py-1 text-xs font-medium text-accent bg-accent/10 rounded-full">
                    {t(`admin.marketingPurpose.${request.purpose}`)}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {dateFormatter.format(request.createdAt)}
                  </span>
                </div>

                <dl className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <User
                      className="w-4 h-4 text-gray-400 shrink-0"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">{t("admin.owner")}</dt>
                    <dd className="font-medium text-gray-900">
                      {request.ownerName}
                    </dd>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone
                      className="w-4 h-4 text-gray-400 shrink-0"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">{t("auth.phone")}</dt>
                    <dd>
                      <a
                        href={`tel:${request.phone}`}
                        dir="ltr"
                        className="text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                      >
                        {request.phone}
                      </a>
                    </dd>
                  </div>

                  <div className="flex items-center gap-2">
                    <MessageCircle
                      className="w-4 h-4 text-gray-400 shrink-0"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">
                      {t("propertyExtra.whatsappContact")}
                    </dt>
                    <dd>
                      <a
                        href={whatsappHref(request.whatsapp ?? request.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="text-[#128C4A] hover:underline focus-visible:ring-2 focus-visible:ring-[#25D366]/40 focus-visible:outline-none rounded"
                      >
                        {request.whatsapp ?? request.phone}
                      </a>
                    </dd>
                  </div>

                  <div className="flex items-center gap-2">
                    <Home
                      className="w-4 h-4 text-gray-400 shrink-0"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">{t("admin.propertyType")}</dt>
                    <dd className="text-gray-700">
                      {t(categoryLabelKey(request.category))}
                    </dd>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin
                      className="w-4 h-4 text-gray-400 shrink-0"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">{t("property.location")}</dt>
                    <dd className="text-gray-700">
                      {request.district}، {request.city}
                    </dd>
                  </div>

                  {request.area ? (
                    <div className="flex items-center gap-2">
                      <Maximize
                        className="w-4 h-4 text-gray-400 shrink-0"
                        aria-hidden="true"
                      />
                      <dt className="sr-only">{t("property.area")}</dt>
                      <dd className="text-gray-700">
                        {formatArea(request.area, locale)}
                      </dd>
                    </div>
                  ) : null}

                  {request.expectedPrice ? (
                    <div className="flex items-center gap-2">
                      <Wallet
                        className="w-4 h-4 text-gray-400 shrink-0"
                        aria-hidden="true"
                      />
                      <dt className="sr-only">
                        {t("newMarketing.expectedPriceLabel")}
                      </dt>
                      <dd className="font-semibold text-primary">
                        <Price amount={request.expectedPrice} />
                      </dd>
                    </div>
                  ) : null}

                  {request.notes ? (
                    <div className="flex items-start gap-2 pt-1">
                      <StickyNote
                        className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <dt className="sr-only">{t("admin.notes")}</dt>
                      <dd className="text-gray-600 leading-relaxed">
                        {request.notes}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <ManagementActions
                  id={request.id}
                  status={request.status}
                  endpoint="/api/admin/marketing"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
