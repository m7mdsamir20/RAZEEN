"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Loader2, AlertCircle, CheckCircle2, Save } from "lucide-react";
import { FormField, FIELD_CLASS } from "@/components/ui/FormField";
import {
  PropertyExtraFields,
  extraFieldsPayload,
  extraFieldsFromProperty,
  type ExtraFieldsValue,
} from "./PropertyExtraFields";
import {
  LocationSelects,
  type LocationValue,
} from "@/components/location/LocationSelects";
import { PROPERTY_TYPES } from "@/types";
import {
  PROPERTY_CATEGORIES,
  categoryLabelKey,
} from "@/lib/property-categories";
import {
  RoomCountFields,
  roomCountsPayload,
  roomCountsFrom,
  type RoomCounts,
} from "./RoomCountFields";

type Errors = Partial<Record<string, string>>;

export interface EditableProperty {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  price: number;
  area: number;
  bedrooms: number;
  livingRooms: number;
  halls: number;
  bathrooms: number;
  region: string | null;
  city: string;
  district: string;
  status: string;
  whatsapp: string | null;
  ageYears: number | null;
  facade: string | null;
  hasRestrictions: boolean;
  hasMortgage: boolean;
  hasWaqf: boolean;
  hasWill: boolean;
  registryRestrictions: string | null;
  obligations: string | null;
  discountPercent: number | null;
}

export function EditPropertyForm({ property }: { property: EditableProperty }) {
  const t = useTranslations();
  const router = useRouter();

  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description);
  const [category, setCategory] = useState(property.category);
  const [type, setType] = useState(property.type);
  const [price, setPrice] = useState(String(property.price));
  const [area, setArea] = useState(String(property.area));
  const [rooms, setRooms] = useState<RoomCounts>(() =>
    roomCountsFrom(property)
  );
  const [place, setPlace] = useState<LocationValue>({
    region: property.region ?? "",
    city: property.city,
    district: property.district,
  });
  const [extra, setExtra] = useState<ExtraFieldsValue>(
    extraFieldsFromProperty(property)
  );

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function validate(): boolean {
    const next: Errors = {};

    if (title.trim().length < 5) next.title = t("validation.titleMin");
    if (description.trim().length < 20)
      next.description = t("validation.descriptionMin");
    if (!price || Number(price) <= 0) next.price = t("validation.priceRequired");
    if (!area || Number(area) <= 0) next.area = t("validation.areaRequired");
    if (place.city.trim().length < 2) next.city = t("validation.cityRequired");
    if (place.district.trim().length < 2)
      next.district = t("validation.districtRequired");

    if (extra.whatsapp && !/^05\d{8}$/.test(extra.whatsapp))
      next.whatsapp = t("contact.phoneInvalid");

    if (extra.discountPercent !== "") {
      const discount = Number(extra.discountPercent);
      if (!Number.isFinite(discount) || discount < 1 || discount > 90) {
        next.discountPercent = t("propertyExtra.discountHint");
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setJustSaved(false);

    if (!validate()) return;

    setIsSaving(true);

    try {
      const res = await fetch(`/api/properties/${property.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          type,
          price: Number(price),
          area: Number(area),
          ...roomCountsPayload(category, rooms),
          city: place.city.trim(),
          district: place.district.trim(),
          ...(place.region ? { region: place.region } : {}),
          ...extraFieldsPayload(extra, { includeDiscount: true }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? t("validation.generic"));
        return;
      }

      setJustSaved(true);
      router.refresh();
    } catch {
      setSubmitError(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {property.status === "PENDING" && (
        <p className="flex items-start gap-2 px-4 py-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          {t("editProperty.pendingNote")}
        </p>
      )}

      {/* Basic info */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("newProperty.basicInfo")}
        </h2>

        <FormField id="edit-title" label={t("property.title")} error={errors.title}>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={FIELD_CLASS}
            maxLength={200}
            aria-invalid={Boolean(errors.title)}
          />
        </FormField>

        <FormField
          id="edit-description"
          label={t("property.description")}
          error={errors.description}
        >
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className={`${FIELD_CLASS} resize-y`}
            maxLength={5000}
            aria-invalid={Boolean(errors.description)}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="edit-type" label={t("property.type")}>
            <select
              id="edit-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={FIELD_CLASS}
            >
              {PROPERTY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {t(`property.for${value === "RENT" ? "Rent" : "Sale"}`)}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="edit-category" label={t("property.category")}>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={FIELD_CLASS}
            >
              {PROPERTY_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {t(categoryLabelKey(value))}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      {/* Details */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newProperty.detailsSection")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="edit-price" label={t("property.price")} error={errors.price}>
            <input
              id="edit-price"
              type="number"
              inputMode="numeric"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.price)}
            />
          </FormField>

          <FormField id="edit-area" label={t("property.area")} error={errors.area}>
            <input
              id="edit-area"
              type="number"
              inputMode="numeric"
              min={1}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.area)}
            />
          </FormField>
        </div>

        {/* Room counts, shown only for the categories that have them */}
        <div className="mt-4">
          <RoomCountFields
            idPrefix="edit-"
            category={category}
            value={rooms}
            onChange={setRooms}
          />
        </div>
      </section>

      {/* Location */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("newProperty.locationSection")}
        </h2>

        <LocationSelects
          idPrefix="edit-"
          value={place}
          onChange={setPlace}
          errors={errors}
        />
      </section>

      <PropertyExtraFields
        value={extra}
        onChange={setExtra}
        errors={errors}
        price={Number(price)}
        showDiscount
        idPrefix="edit-"
      />

      {submitError && (
        <p
          className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {submitError}
        </p>
      )}

      {justSaved && (
        <p
          className="flex items-center gap-2 px-4 py-3 text-sm text-green-800 bg-green-50 border border-green-100 rounded-xl"
          role="status"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          {t("editProperty.saved")}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center gap-2 flex-1 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[52px]"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="w-5 h-5" aria-hidden="true" />
          )}
          {isSaving ? t("editProperty.saving") : t("editProperty.save")}
        </button>

        <Link
          href="/my-listings"
          className="flex items-center justify-center px-6 py-3 text-base font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[52px]"
        >
          {t("editProperty.cancel")}
        </Link>
      </div>
    </form>
  );
}
