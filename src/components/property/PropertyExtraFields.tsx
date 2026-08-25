"use client";

import { useTranslations, useLocale } from "next-intl";
import { FormField, FIELD_CLASS } from "@/components/ui/FormField";
import { Riyal } from "@/components/ui/Riyal";
import { formatAmount, discountedPrice } from "@/lib/utils";
import { PROPERTY_FACADES } from "@/types";

/** Maps a facade constant to its translation key. */
export function facadeLabelKey(facade: string): string {
  const suffix = facade
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join("");
  return `propertyExtra.facade${suffix}`;
}

export interface ExtraFieldsValue {
  whatsapp: string;
  ageYears: string;
  facade: string;
  discountPercent: string;
}

export const EMPTY_EXTRA_FIELDS: ExtraFieldsValue = {
  whatsapp: "",
  ageYears: "",
  facade: "",
  discountPercent: "",
};

/**
 * Turn the form's string fields into the API's shape.
 *
 * Blank optional fields are omitted rather than sent as empty strings, so the
 * server stores null instead of "". `discountPercent` is the exception: on the
 * edit form an empty box means "remove the discount", which needs an explicit
 * null to overwrite the stored value.
 */
export function extraFieldsPayload(
  value: ExtraFieldsValue,
  { includeDiscount = false }: { includeDiscount?: boolean } = {}
) {
  const age = Number(value.ageYears);
  const discount = Number(value.discountPercent);

  return {
    ...(value.whatsapp ? { whatsapp: value.whatsapp } : {}),
    ...(value.ageYears !== "" && Number.isFinite(age) ? { ageYears: age } : {}),
    ...(value.facade ? { facade: value.facade } : {}),
    ...(includeDiscount
      ? {
          discountPercent:
            value.discountPercent !== "" && Number.isFinite(discount)
              ? discount
              : null,
        }
      : {}),
  };
}

/** Populate the form from a stored listing. */
export function extraFieldsFromProperty(property: {
  whatsapp: string | null;
  ageYears: number | null;
  facade: string | null;
  discountPercent: number | null;
}): ExtraFieldsValue {
  return {
    whatsapp: property.whatsapp ?? "",
    ageYears: property.ageYears === null ? "" : String(property.ageYears),
    facade: property.facade ?? "",
    discountPercent:
      property.discountPercent === null ? "" : String(property.discountPercent),
  };
}

interface Props {
  value: ExtraFieldsValue;
  onChange: (next: ExtraFieldsValue) => void;
  errors?: Partial<Record<string, string>>;
  /** The listing price, used to preview the discounted figure. */
  price?: number;
  /** Discounts only make sense once a listing exists at a set price. */
  showDiscount?: boolean;
  idPrefix?: string;
}

/**
 * Contact, age/facade and (optionally) discount.
 * Shared by the create and edit forms so the two never drift apart.
 */
export function PropertyExtraFields({
  value,
  onChange,
  errors = {},
  price,
  showDiscount = false,
  idPrefix = "",
}: Props) {
  const t = useTranslations();
  const locale = useLocale();

  const set = <K extends keyof ExtraFieldsValue>(
    key: K,
    next: ExtraFieldsValue[K]
  ) => onChange({ ...value, [key]: next });

  const id = (name: string) => `${idPrefix}${name}`;

  const discountValue = Number(value.discountPercent);
  const hasPreviewableDiscount =
    showDiscount &&
    typeof price === "number" &&
    price > 0 &&
    Number.isFinite(discountValue) &&
    discountValue >= 1 &&
    discountValue <= 90;

  return (
    <>
      {/* Age + facade */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("propertyExtra.ageSection")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id={id("ageYears")}
            label={t("propertyExtra.age")}
            error={errors.ageYears}
          >
            <input
              id={id("ageYears")}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={value.ageYears}
              onChange={(e) => set("ageYears", e.target.value)}
              placeholder={t("propertyExtra.agePlaceholder")}
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.ageYears)}
            />
          </FormField>

          <FormField id={id("facade")} label={t("propertyExtra.facade")}>
            <select
              id={id("facade")}
              value={value.facade}
              onChange={(e) => set("facade", e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">{t("propertyExtra.ageUnknown")}</option>
              {PROPERTY_FACADES.map((facade) => (
                <option key={facade} value={facade}>
                  {t(facadeLabelKey(facade))}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="mt-4">
          <FormField
            id={id("whatsapp")}
            label={t("propertyExtra.whatsapp")}
            error={errors.whatsapp}
          >
            <input
              id={id("whatsapp")}
              type="tel"
              dir="ltr"
              inputMode="numeric"
              autoComplete="tel"
              value={value.whatsapp}
              onChange={(e) =>
                set("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="05XXXXXXXX"
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.whatsapp)}
            />
          </FormField>
          <p className="text-xs text-gray-500 mt-1">
            {t("propertyExtra.whatsappHint")}
          </p>
        </div>
      </section>

      {/* Discount */}
      {showDiscount && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("propertyExtra.discountSection")}
          </h2>

          <FormField
            id={id("discountPercent")}
            label={t("propertyExtra.discountPercent")}
            error={errors.discountPercent}
          >
            <input
              id={id("discountPercent")}
              type="number"
              inputMode="numeric"
              min={1}
              max={90}
              value={value.discountPercent}
              onChange={(e) => set("discountPercent", e.target.value)}
              placeholder="0"
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.discountPercent)}
            />
          </FormField>

          <p className="text-xs text-gray-500 mt-1">
            {t("propertyExtra.discountHint")}
          </p>

          {hasPreviewableDiscount && (
            <p className="mt-3 px-4 py-3 text-sm bg-green-50 border border-green-100 rounded-xl text-green-800">
              {t("propertyExtra.priceAfterDiscount")}:{" "}
              <span className="inline-flex items-baseline gap-1 font-bold">
                {formatAmount(discountedPrice(price, discountValue), locale)}
                <Riyal />
              </span>
            </p>
          )}
        </section>
      )}
    </>
  );
}
