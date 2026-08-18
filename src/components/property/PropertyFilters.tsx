"use client";

import { useTranslations } from "next-intl";
import {
  FilterPanel,
  FilterSelect,
  useFilterParams,
  FILTER_FIELD_CLASS,
} from "@/components/filters/FilterPanel";
import { LocationFilter } from "@/components/filters/LocationFilter";
import { PROPERTY_CATEGORIES, PROPERTY_TYPES } from "@/types";
import { CATEGORY_LABEL_KEYS } from "@/lib/categories";

const KEYS = [
  "category",
  "type",
  "region",
  "city",
  "district",
  "minPrice",
  "maxPrice",
  "bedrooms",
] as const;

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];

export function PropertyFilters() {
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
        id="filter-type"
        label={t("property.type")}
        value={values.type}
        onChange={(value) => update("type", value)}
        options={PROPERTY_TYPES.map((value) => ({
          value,
          label: t(`property.for${value === "RENT" ? "Rent" : "Sale"}`),
        }))}
      />

      <FilterSelect
        id="filter-category"
        label={t("property.category")}
        value={values.category}
        onChange={(value) => update("category", value)}
        options={PROPERTY_CATEGORIES.map((value) => ({
          value,
          label: t(CATEGORY_LABEL_KEYS[value]),
        }))}
      />

      <LocationFilter
        region={values.region}
        city={values.city}
        district={values.district}
        onChange={update}
      />

      {/* Price range — committed on blur so typing does not refetch per keystroke */}
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1.5">
          {t("filters.priceRange")}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={t("filters.min")}
            defaultValue={values.minPrice}
            onBlur={(e) => update("minPrice", e.target.value)}
            aria-label={t("filters.minPrice")}
            className={FILTER_FIELD_CLASS}
            min={0}
          />
          <span className="text-gray-400" aria-hidden="true">
            —
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder={t("filters.max")}
            defaultValue={values.maxPrice}
            onBlur={(e) => update("maxPrice", e.target.value)}
            aria-label={t("filters.maxPrice")}
            className={FILTER_FIELD_CLASS}
            min={0}
          />
        </div>
      </div>

      <FilterSelect
        id="filter-bedrooms"
        label={t("property.bedrooms")}
        value={values.bedrooms}
        onChange={(value) => update("bedrooms", value)}
        options={BEDROOM_OPTIONS.map((n) => ({
          value: String(n),
          label: `${n}+`,
        }))}
      />
    </FilterPanel>
  );
}
