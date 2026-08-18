"use client";

import { useTranslations } from "next-intl";
import {
  MapPin,
  Wallet,
  Phone,
  Building2,
  BadgeCheck,
  BedDouble,
  Sofa,
  LayoutPanelTop,
  Bath,
} from "lucide-react";
import { Price } from "@/components/ui/Price";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import type { PropertyRequestListItem } from "@/lib/queries/requests";
import { categoryLabelKey, fieldsFor } from "@/lib/property-categories";

interface RequestCardProps {
  request: PropertyRequestListItem;
}

export function RequestCard({ request }: RequestCardProps) {
  const t = useTranslations();

  const isCompany = request.publisherType === "COMPANY";
  const isRent = request.type === "RENT";

  // WhatsApp falls back to the account's mobile, the same rule listings use.
  const whatsappNumber = request.whatsapp || request.user.phone;

  const fields = fieldsFor(request.category);
  const counts = [
    { show: fields.bedrooms, value: request.bedrooms, Icon: BedDouble, label: t("property.bedrooms") },
    { show: fields.livingRooms, value: request.livingRooms, Icon: Sofa, label: t("property.livingRooms") },
    { show: fields.halls, value: request.halls, Icon: LayoutPanelTop, label: t("property.halls") },
    { show: fields.bathrooms, value: request.bathrooms, Icon: Bath, label: t("property.bathrooms") },
  ].filter((c) => c.show && (c.value ?? 0) > 0);

  return (
    <article className="flex flex-col bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary/20 hover:shadow-sm transition-[box-shadow,border-color]">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
          {t(categoryLabelKey(request.category))}
        </span>
        <span className="px-3 py-1 text-xs font-medium text-accent bg-accent/10 rounded-full">
          {isRent ? t("requests.wantsToRent") : t("requests.wantsToBuy")}
        </span>
      </div>

      {/* Requester — the verified name, or the company's */}
      <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        {isCompany ? (
          <Building2
            className="w-3.5 h-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
        ) : (
          <BadgeCheck
            className="w-3.5 h-3.5 shrink-0 text-primary"
            aria-hidden="true"
          />
        )}
        <span className="truncate font-medium text-gray-700">
          {request.user.name}
        </span>
      </p>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        {request.title}
      </h3>

      {/* Details */}
      <dl className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
          <dt className="sr-only">{t("property.location")}</dt>
          <dd>
            {request.district}، {request.city}
          </dd>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Wallet className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
          <dt className="sr-only">{t("requests.budget")}</dt>
          <dd className="font-semibold text-primary">
            <Price amount={request.budget} />
          </dd>
        </div>
      </dl>

      {/* Room counts — only the ones this category asks for */}
      {counts.length > 0 ? (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-600 mb-4">
          {counts.map(({ value, Icon, label }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
              <span className="sr-only">{label}</span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Contact — pushed to the bottom so cards in a row line up */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-1">{t("requests.requestedBy")}</p>
        <p className="text-sm font-medium text-gray-900 mb-3">
          {request.user.name}
        </p>

        <WhatsAppButton
          phone={whatsappNumber}
          label={t("propertyExtra.whatsappContact")}
          message={t("requests.whatsappMessage", { title: request.title })}
        />

        <a
          href={`tel:${request.user.phone}`}
          className="flex items-center justify-center gap-2 w-full mt-2 px-4 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
        >
          <Phone className="w-4 h-4" aria-hidden="true" />
          {t("requests.contact")}
        </a>
      </div>
    </article>
  );
}
