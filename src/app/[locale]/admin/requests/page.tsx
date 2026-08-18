import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  Inbox,
  MapPin,
  Wallet,
  BadgeCheck,
  Building2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { getAdminRequests } from "@/lib/queries/admin";
import { Price } from "@/components/ui/Price";
import { categoryLabelKey } from "@/lib/categories";
import { ListingStatusBadge } from "@/components/property/ListingStatusBadge";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { StatusFilter } from "@/components/admin/StatusFilter";

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
    title: `${t("admin.nav.requests")} — ${t("common.appName")}`,
    robots: { index: false, follow: false },
  };
}

export default async function AdminRequestsPage({
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
    getAdminRequests(statusParam),
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
          {requests.map((request) => {
            const isCompany = request.publisherType === "COMPANY";

            return (
              <li
                key={request.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <ListingStatusBadge status={request.status} />
                    <span className="px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                      {t(categoryLabelKey(request.category))}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {dateFormatter.format(request.createdAt)}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-gray-900">
                    {request.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin
                        className="w-3.5 h-3.5 text-gray-400"
                        aria-hidden="true"
                      />
                      {request.district}، {request.city}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <Wallet
                        className="w-3.5 h-3.5 text-gray-400"
                        aria-hidden="true"
                      />
                      <Price amount={request.budget} />
                    </span>
                  </div>

                  <p className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                    {isCompany ? (
                      <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {t("admin.publisher")}: {request.user.name} ·{" "}
                    <span dir="ltr">{request.user.phone}</span>
                  </p>
                </div>

                {request.status === "REJECTED" && request.rejectionReason && (
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
                        {request.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                  <ModerationActions
                    resource="requests"
                    id={request.id}
                    status={request.status}
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
