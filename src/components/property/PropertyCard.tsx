"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Eye,
  Building2,
  BadgeCheck,
  Compass,
} from "lucide-react";
import { formatArea } from "@/lib/utils";
import { Price, DiscountBadge } from "@/components/ui/Price";
import { FavoriteButton } from "./FavoriteButton";
import { PropertyAgeBadge } from "./PropertyAgeBadge";
import { DealStatusBadge } from "./DealStatusActions";
import { facadeLabelKey } from "./PropertyExtraFields";
import type { PropertyListItem } from "@/lib/queries/properties";

interface PropertyCardProps {
  property: PropertyListItem;
  /** Omitted for signed-out visitors, who get no favourite toggle. */
  isFavorite?: boolean;
  refreshOnFavoriteToggle?: boolean;
}

const PLACEHOLDER = "/placeholder-property.svg";

export function PropertyCard({
  property,
  isFavorite,
  refreshOnFavoriteToggle = false,
}: PropertyCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [imageFailed, setImageFailed] = useState(false);

  // A listing may be published with video only, in which case the clip's
  // poster frame stands in for the missing cover photo.
  const preview =
    property.images[0]?.thumbnailUrl ?? property.videos?.[0]?.thumbnailUrl;
  const thumbnailUrl = imageFailed || !preview ? PLACEHOLDER : preview;

  const isCompany = property.publisherType === "COMPANY";

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-primary/20 transition-[box-shadow,border-color] duration-200"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <Image
          src={thumbnailUrl}
          alt={property.title}
          fill
          onError={() => setImageFailed(true)}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Type badge (RENT / SALE) */}
        <span
          className={`absolute top-3 start-3 px-3 py-1 text-xs font-semibold rounded-full ${
            property.type === "RENT"
              ? "bg-blue-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {t(`property.for${property.type === "RENT" ? "Rent" : "Sale"}`)}
        </span>

        {/* Favourite toggle — signed-out visitors get no button */}
        {isFavorite !== undefined && (
          <div className="absolute top-3 end-3">
            <FavoriteButton
              propertyId={property.id}
              initialIsFavorite={isFavorite}
              refreshOnToggle={refreshOnFavoriteToggle}
            />
          </div>
        )}

        {/* Closed deal — dim the photo and say so */}
        {property.dealStatus && (
          <>
            <div className="absolute inset-0 bg-white/55" aria-hidden="true" />
            <div className="absolute inset-0 flex items-center justify-center">
              <DealStatusBadge dealStatus={property.dealStatus} className="text-sm px-4 py-1.5" />
            </div>
          </>
        )}

        {/* Views */}
        {property.views > 0 && (
          <span className="absolute bottom-3 start-3 flex items-center gap-1 px-2 py-1 text-xs text-white bg-black/50 rounded-full backdrop-blur-sm">
            <Eye className="w-3 h-3" aria-hidden="true" />
            {property.views}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Publisher — the Nafath-verified name, or the company's */}
        <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
          {isCompany ? (
            <Building2 className="w-3.5 h-3.5 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <BadgeCheck className="w-3.5 h-3.5 shrink-0 text-primary" aria-hidden="true" />
          )}
          <span className="truncate font-medium text-gray-700">
            {property.user.name}
          </span>
        </p>

        {/* Price */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-lg font-bold text-primary">
            <Price
              amount={property.price}
              discountPercent={property.discountPercent}
              originalClassName="text-sm"
            />
          </span>
          {property.type === "RENT" && (
            <span className="text-sm font-normal text-gray-500">
              / {t("property.perYear")}
            </span>
          )}
          {property.discountPercent ? (
            <DiscountBadge discountPercent={property.discountPercent} />
          ) : null}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {property.district}، {property.city}
          </span>
        </div>

        {/* Age + facade */}
        {(property.ageYears !== null || property.facade) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <PropertyAgeBadge ageYears={property.ageYears} />
            {property.facade && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                <Compass className="w-3 h-3" aria-hidden="true" />
                {t(facadeLabelKey(property.facade))}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-sm text-gray-600">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <BedDouble className="w-4 h-4" aria-hidden="true" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4" aria-hidden="true" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4" aria-hidden="true" />
            <span>{formatArea(property.area, locale)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
