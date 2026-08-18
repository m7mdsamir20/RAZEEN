"use client";

import { useTranslations } from "next-intl";
import {
  FilterPanel,
  FilterSelect,
  useFilterParams,
} from "@/components/filters/FilterPanel";
import { LocationFilter } from "@/components/filters/LocationFilter";
import { PROPERTY_CATEGORIES, PROPERTY_TYPES } from "@/types";
import { CATEGORY_LABEL_KEYS } from "@/lib/categories";

const KEYS = ["category", "type", "region", "city", "district"] as const;

export function MapFilters() {
  const t = useTranslations();
  const { values, activeCount, isPending, update, clearAll } =
    useFilterParams(KEYS);

  return (
    <FilterPanel
      activeCount={activeCount}
      isPending={isPending}
      onClearAll={clearAll}
    >
      <FilterSelect
        id="map-filter-type"
        label={t("property.type")}
        value={values.type}
        onChange={(value) => update("type", value)}
        options={PROPERTY_TYPES.map((value) => ({
          value,
          label: t(`property.for${value === "RENT" ? "Rent" : "Sale"}`),
        }))}
      />

      <FilterSelect
        id="map-filter-category"
        label={t("property.category")}
        value={values.category}
        onChange={(value) => update("category", value)}
        options={PROPERTY_CATEGORIES.map((value) => ({
          value,
          label: t(CATEGORY_LABEL_KEYS[value]),
        }))}
      />

      <LocationFilter
        idPrefix="map-"
        region={values.region}
        city={values.city}
        district={values.district}
        onChange={update}
        showDistrict={false}
      />
    </FilterPanel>
  );
}
