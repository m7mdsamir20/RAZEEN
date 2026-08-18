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
  hasRestrictions: boolean;
  hasMortgage: boolean;
  hasWaqf: boolean;
  hasWill: boolean;
  registryRestrictions: string;
  obligations: string;
  discountPercent: string;
}

export const EMPTY_EXTRA_FIELDS: ExtraFieldsValue = {
  whatsapp: "",
  ageYears: "",
  facade: "",
  hasRestrictions: false,
  hasMortgage: false,
  hasWaqf: false,
  hasWill: false,
  registryRestrictions: "",
  obligations: "",
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
    hasRestrictions: value.hasRestrictions,
    hasMortgage: value.hasMortgage,
    hasWaqf: value.hasWaqf,
    hasWill: value.hasWill,
    ...(value.registryRestrictions.trim()
      ? { registryRestrictions: value.registryRestrictions.trim() }
      : {}),
    ...(value.obligations.trim()
      ? { obligations: value.obligations.trim() }
      : {}),
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
  hasRestrictions: boolean;
  hasMortgage: boolean;
  hasWaqf: boolean;
  hasWill: boolean;
  registryRestrictions: string | null;
  obligations: string | null;
  discountPercent: number | null;
}): ExtraFieldsValue {
  return {
    whatsapp: property.whatsapp ?? "",
    ageYears: property.ageYears === null ? "" : String(property.ageYears),
    facade: property.facade ?? "",
    hasRestrictions: property.hasRestrictions,
    hasMortgage: property.hasMortgage,
    hasWaqf: property.hasWaqf,
    hasWill: property.hasWill,
    registryRestrictions: property.registryRestrictions ?? "",
    obligations: property.obligations ?? "",
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
 * Contact, age/facade, legal status and (optionally) discount.
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

  const legalToggles = [
    { key: "hasRestrictions", labelKey: "propertyExtra.hasRestrictions" },
    { key: "hasMortgage", labelKey: "propertyExtra.hasMortgage" },
    { key: "hasWaqf", labelKey: "propertyExtra.hasWaqf" },
    { key: "hasWill", labelKey: "propertyExtra.hasWill" },
  ] as const;

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

      {/* Legal status */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {t("propertyExtra.legalSection")}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {t("propertyExtra.legalHint")}
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {legalToggles.map(({ key, labelKey }) => (
            <li key={key}>
              <label
                htmlFor={id(key)}
                className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-[background-color,border-color] min-h-[48px]"
              >
                <input
                  id={id(key)}
                  type="checkbox"
                  checked={value[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <span className="text-base text-gray-800">{t(labelKey)}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="space-y-4">
          <FormField
            id={id("registryRestrictions")}
            label={t("propertyExtra.registryRestrictions")}
          >
            <textarea
              id={id("registryRestrictions")}
              value={value.registryRestrictions}
              onChange={(e) => set("registryRestrictions", e.target.value)}
              placeholder={t("propertyExtra.registryPlaceholder")}
              rows={3}
              maxLength={1000}
              className={`${FIELD_CLASS} resize-y`}
            />
          </FormField>

          <FormField
            id={id("obligations")}
            label={t("propertyExtra.obligations")}
          >
            <textarea
              id={id("obligations")}
              value={value.obligations}
              onChange={(e) => set("obligations", e.target.value)}
              placeholder={t("propertyExtra.obligationsPlaceholder")}
              rows={3}
              maxLength={1000}
              className={`${FIELD_CLASS} resize-y`}
            />
          </FormField>
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
