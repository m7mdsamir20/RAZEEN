"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin, BedDouble, Bath, Maximize, ArrowLeft } from "lucide-react";
import { formatArea } from "@/lib/utils";
import { Price } from "@/components/ui/Price";
import { categoryColor, categoryLabelKey } from "@/lib/categories";
import type { MapProperty } from "@/lib/queries/map";

const PLACEHOLDER = "/placeholder-property.svg";

/** Compact property summary rendered inside the map's InfoWindow. */
export function MapPopupCard({ property }: { property: MapProperty }) {
  const t = useTranslations();
  const locale = useLocale();
  const [imageFailed, setImageFailed] = useState(false);

  const thumbnail = property.images[0]?.thumbnailUrl;
  const src = !thumbnail || imageFailed ? PLACEHOLDER : thumbnail;

  return (
    <div className="w-[260px]">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="260px"
          onError={() => setImageFailed(true)}
        />
        <span
          className="absolute top-2 start-2 px-2 py-0.5 text-[11px] font-medium text-white rounded-full"
          style={{ backgroundColor: categoryColor(property.category) }}
        >
          {t(categoryLabelKey(property.category))}
        </span>
        <span
          className={`absolute top-2 end-2 px-2 py-0.5 text-[11px] font-semibold rounded-full text-white ${
            property.type === "RENT" ? "bg-blue-600" : "bg-emerald-600"
          }`}
        >
          {t(`property.for${property.type === "RENT" ? "Rent" : "Sale"}`)}
        </span>
      </div>

      <p className="text-base font-bold text-primary mb-0.5">
        <Price amount={property.price} />
      </p>

      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1.5">
        {property.title}
      </h3>

      <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
        <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span className="truncate">
          {property.district}، {property.city}
        </span>
      </p>

      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100 text-xs text-gray-600">
        {property.bedrooms > 0 && (
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
            {property.bedrooms}
          </span>
        )}
        {property.bathrooms > 0 && (
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5" aria-hidden="true" />
            {property.bathrooms}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Maximize className="w-3.5 h-3.5" aria-hidden="true" />
          {formatArea(property.area, locale)}
        </span>
      </div>

      <Link
        href={`/properties/${property.id}`}
        className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[40px]"
      >
        {t("map.viewDetails")}
        <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
      </Link>
    </div>
  );
}
