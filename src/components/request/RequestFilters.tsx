"use client";

import { useTranslations } from "next-intl";
import {
  FilterPanel,
  FilterSelect,
  useFilterParams,
} from "@/components/filters/FilterPanel";
import { LocationFilter } from "@/components/filters/LocationFilter";
import { PROPERTY_CATEGORIES } from "@/types";
import { CATEGORY_LABEL_KEYS } from "@/lib/categories";

const KEYS = ["category", "region", "city", "district"] as const;

export function RequestFilters() {
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
        id="request-filter-category"
        label={t("property.category")}
        value={values.category}
        onChange={(value) => update("category", value)}
        options={PROPERTY_CATEGORIES.map((value) => ({
          value,
          label: t(CATEGORY_LABEL_KEYS[value]),
        }))}
      />

      <LocationFilter
        idPrefix="request-"
        region={values.region}
        city={values.city}
        district={values.district}
        onChange={update}
      />
    </FilterPanel>
  );
}
