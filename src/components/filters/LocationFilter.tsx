"use client";

import { useTranslations, useLocale } from "next-intl";
import { FilterSelect } from "./FilterPanel";
import {
  SAUDI_REGIONS,
  citiesForRegion,
  districtsForCity,
  regionForCity,
  regionLabel,
  cityLabel,
} from "@/lib/saudi-locations";

interface Props {
  region: string;
  city: string;
  district: string;
  onChange: (key: "region" | "city" | "district", value: string) => void;
  idPrefix?: string;
  /** District narrowing is only worth showing where we have the data. */
  showDistrict?: boolean;
}

/**
 * Region → city → district filter. Picking a region narrows the city list and
 * clears any city that no longer belongs to it.
 */
export function LocationFilter({
  region,
  city,
  district,
  onChange,
  idPrefix = "",
  showDistrict = true,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();

  const effectiveRegion = region || regionForCity(city)?.value || "";
  const cities = citiesForRegion(effectiveRegion || undefined);
  const districts = city ? districtsForCity(city) : [];

  return (
    <>
      <FilterSelect
        id={`${idPrefix}filter-region`}
        label={t("location.region")}
        value={effectiveRegion}
        onChange={(value) => {
          // Clear the city when it no longer sits in the chosen region.
          if (city && value && regionForCity(city)?.value !== value) {
            onChange("city", "");
          }
          onChange("region", value);
        }}
        options={SAUDI_REGIONS.map((r) => ({
          value: r.value,
          label: regionLabel(r, locale),
        }))}
      />

      <FilterSelect
        id={`${idPrefix}filter-city`}
        label={t("property.city")}
        value={city}
        onChange={(value) => onChange("city", value)}
        options={cities.map((c) => ({
          value: c.ar,
          label: cityLabel(c, locale),
        }))}
      />

      {showDistrict && districts.length > 0 && (
        <FilterSelect
          id={`${idPrefix}filter-district`}
          label={t("property.district")}
          value={district}
          onChange={(value) => onChange("district", value)}
          options={districts.map((d) => ({ value: d, label: d }))}
        />
      )}
    </>
  );
}
