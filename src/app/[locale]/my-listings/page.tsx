import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import {
  FileText,
  LogIn,
  Plus,
  MapPin,
  Maximize,
  AlertCircle,
  Calendar,
  Pencil,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { getUserListings } from "@/lib/queries/account";
import { formatArea } from "@/lib/utils";
import { Price } from "@/components/ui/Price";
import { Gate } from "@/components/ui/FormField";
import { SignInButton } from "@/components/auth/SignInButton";
import { ListingStatusBadge } from "@/components/property/ListingStatusBadge";
import {
  DealStatusActions,
  DealStatusBadge,
} from "@/components/property/DealStatusActions";

const PLACEHOLDER = "/placeholder-property.svg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: `${t("myListings.title")} — ${t("common.appName")}`,
    description: t("myListings.subtitle"),
  };
}

export default async function MyListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session] = await Promise.all([params, getSession()]);
  const t = await getTranslations({ locale });

  if (!session.isLoggedIn || !session.userId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <Gate
          icon={<LogIn className="w-8 h-8 text-gray-400" aria-hidden="true" />}
          title={t("account.signInTitle")}
          description={t("account.signInDesc")}
        >
          <SignInButton />
        </Gate>
      </div>
    );
  }

  const listings = await getUserListings(session.userId);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {t("myListings.title")}
          </h1>
          <p className="text-base text-gray-500">{t("myListings.subtitle")}</p>
        </div>

        <Link
          href="/properties/new"
          className="flex items-center justify-center gap-2 px-5 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[48px] shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          {t("header.addListing")}
        </Link>
      </header>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t("myListings.emptyTitle")}
          </h2>
          <p className="text-base text-gray-500 max-w-sm mb-6">
            {t("myListings.emptyDesc")}
          </p>
          <Link
            href="/properties/new"
            className="px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors min-h-[48px] flex items-center"
          >
            {t("myListings.addFirst")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => {
            const thumbnail = listing.images[0]?.thumbnailUrl || PLACEHOLDER;
            // Only approved listings have a public page to link to.
            const isLinkable = listing.status === "APPROVED";

            const content = (
              <>
                <div className="relative w-24 h-24 sm:w-32 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <ListingStatusBadge status={listing.status} />
                    <DealStatusBadge dealStatus={listing.dealStatus} />
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {dateFormatter.format(listing.createdAt)}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    {listing.title}
                  </h2>

                  <p className="text-base font-bold text-primary mt-1">
                    <Price amount={listing.price} discountPercent={listing.discountPercent} />
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                      {listing.district}، {listing.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize className="w-3.5 h-3.5" aria-hidden="true" />
                      {formatArea(listing.area, locale)}
                    </span>
                  </div>
                </div>
              </>
            );

            return (
              <li
                key={listing.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
              >
                {isLinkable ? (
                  <Link
                    href={`/properties/${listing.id}`}
                    className="flex gap-4 p-4 hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex gap-4 p-4">{content}</div>
                )}

                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                  {/* Closing a deal only makes sense once the listing is live */}
                  {listing.status === "APPROVED" && (
                    <DealStatusActions
                      propertyId={listing.id}
                      type={listing.type}
                      dealStatus={listing.dealStatus}
                    />
                  )}

                  <Link
                    href={`/properties/${listing.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    {t("editProperty.edit")}
                  </Link>
                </div>

                {listing.status === "REJECTED" && listing.rejectionReason && (
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
                        {listing.rejectionReason}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
