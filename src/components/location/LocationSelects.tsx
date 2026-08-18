"use client";

import { useTranslations, useLocale } from "next-intl";
import { FormField, FIELD_CLASS } from "@/components/ui/FormField";
import {
  SAUDI_REGIONS,
  citiesForRegion,
  districtsForCity,
  regionForCity,
  regionLabel,
  cityLabel,
} from "@/lib/saudi-locations";

export interface LocationValue {
  region: string;
  city: string;
  district: string;
}

interface Props {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  errors?: Partial<Record<string, string>>;
  idPrefix?: string;
}

/**
 * Region → city → district, each narrowing the next.
 *
 * District stays a free-text input backed by a datalist: only the largest
 * cities have district data, so suggestions help where we have them without
 * blocking entry where we do not.
 */
export function LocationSelects({
  value,
  onChange,
  errors = {},
  idPrefix = "",
}: Props) {
  const t = useTranslations();
  const locale = useLocale();

  const id = (name: string) => `${idPrefix}location-${name}`;

  // A city chosen before its region (e.g. when editing an old listing) still
  // filters correctly by looking the region up from the city.
  const effectiveRegion = value.region || regionForCity(value.city)?.value || "";
  const cities = citiesForRegion(effectiveRegion || undefined);
  const districts = districtsForCity(value.city);

  function selectRegion(region: string) {
    // Changing region invalidates the city and district beneath it.
    onChange({ region, city: "", district: "" });
  }

  function selectCity(city: string) {
    onChange({
      region: effectiveRegion || regionForCity(city)?.value || "",
      city,
      district: "",
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField id={id("region")} label={t("location.region")}>
        <select
          id={id("region")}
          value={effectiveRegion}
          onChange={(e) => selectRegion(e.target.value)}
          className={FIELD_CLASS}
        >
          <option value="">{t("location.chooseRegion")}</option>
          {SAUDI_REGIONS.map((region) => (
            <option key={region.value} value={region.value}>
              {regionLabel(region, locale)}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id={id("city")}
        label={t("property.city")}
        error={errors.city}
      >
        <select
          id={id("city")}
          value={value.city}
          onChange={(e) => selectCity(e.target.value)}
          className={FIELD_CLASS}
          aria-invalid={Boolean(errors.city)}
        >
          <option value="">{t("location.chooseCity")}</option>
          {cities.map((city) => (
            <option key={city.ar} value={city.ar}>
              {cityLabel(city, locale)}
            </option>
          ))}
        </select>
      </FormField>

      <div className="sm:col-span-2">
        <FormField
          id={id("district")}
          label={t("property.district")}
          error={errors.district}
        >
          <input
            id={id("district")}
            type="text"
            list={districts.length > 0 ? `${id("district")}-options` : undefined}
            value={value.district}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
            placeholder={
              value.city
                ? t("location.chooseDistrict")
                : t("location.chooseCityFirst")
            }
            className={FIELD_CLASS}
            maxLength={100}
            aria-invalid={Boolean(errors.district)}
          />
        </FormField>

        {districts.length > 0 && (
          <datalist id={`${id("district")}-options`}>
            {districts.map((district) => (
              <option key={district} value={district} />
            ))}
          </datalist>
        )}
      </div>
    </div>
  );
}
