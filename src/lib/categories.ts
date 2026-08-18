import { PROPERTY_CATEGORIES, type PropertyCategory } from "@/lib/property-categories";

/**
 * Per-category marker colours, grouped by family so the map reads at a
 * glance: residential in brand teal, commercial in slate, land in olive.
 * Every colour is dark enough to carry a white glyph.
 */
const RESIDENTIAL = "#123B3A"; // brand teal
const FURNISHED = "#1D5C58";
const VILLA_C = "#B77A5A"; // brand copper
const FLOOR_C = "#8E5A3E";
const CHALET_C = "#7A5B7E";
const BUILDING = "#2F4858";
const COMMERCIAL = "#3E6274";
const HOSPITALITY = "#9A6A3C";
const LAND = "#5C7A4A";
const AGRI = "#6E8B4B";

export const CATEGORY_COLORS: Record<PropertyCategory, string> = {
  RESIDENTIAL_APARTMENT: RESIDENTIAL,
  FURNISHED_APARTMENT: FURNISHED,
  STUDIO: "#2A7A73",
  ROOM: "#3E9089",
  VILLA: VILLA_C,
  FLOOR: FLOOR_C,
  CHALET: CHALET_C,
  RESIDENTIAL_BUILDING: BUILDING,
  COMMERCIAL_BUILDING: COMMERCIAL,
  HOTEL: HOSPITALITY,
  OFFICE: "#25506B",
  SHOP: "#4A6B7C",
  WAREHOUSE: "#556B72",
  FARM: "#7F9E4E",
  RESIDENTIAL_LAND: LAND,
  COMMERCIAL_LAND: "#4F6B3F",
  AGRICULTURAL_LAND: AGRI,
};

/** Slightly darker rims so pins stay legible against pale map tiles. */
function darken(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - 40);
  const g = Math.max(0, ((n >> 8) & 255) - 40);
  const b = Math.max(0, (n & 255) - 40);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export const CATEGORY_BORDER_COLORS: Record<PropertyCategory, string> =
  Object.fromEntries(
    PROPERTY_CATEGORIES.map((c) => [c, darken(CATEGORY_COLORS[c])])
  ) as Record<PropertyCategory, string>;

export const CATEGORY_LABEL_KEYS: Record<PropertyCategory, string> =
  Object.fromEntries(
    PROPERTY_CATEGORIES.map((c) => [c, `categories.${c}`])
  ) as Record<PropertyCategory, string>;

export function categoryColor(category: string): string {
  return (
    CATEGORY_COLORS[category as PropertyCategory] ??
    CATEGORY_COLORS.RESIDENTIAL_APARTMENT
  );
}

export function categoryBorderColor(category: string): string {
  return (
    CATEGORY_BORDER_COLORS[category as PropertyCategory] ??
    CATEGORY_BORDER_COLORS.RESIDENTIAL_APARTMENT
  );
}

export function categoryLabelKey(category: string): string {
  return `categories.${category}`;
}
