/**
 * The property types the platform lists, and which detail fields each one
 * actually needs.
 *
 * A plot of land has no bedrooms and a warehouse has no living rooms, so the
 * form and the cards ask for — and show — only what applies. Keeping that
 * decision here means the form, the request form, the cards and the detail
 * page all agree without repeating the rules.
 */

export const PROPERTY_CATEGORIES = [
  "RESIDENTIAL_APARTMENT",
  "FURNISHED_APARTMENT",
  "STUDIO",
  "ROOM",
  "VILLA",
  "FLOOR",
  "CHALET",
  "RESIDENTIAL_BUILDING",
  "COMMERCIAL_BUILDING",
  "HOTEL",
  "OFFICE",
  "SHOP",
  "WAREHOUSE",
  "FARM",
  "RESIDENTIAL_LAND",
  "COMMERCIAL_LAND",
  "AGRICULTURAL_LAND",
] as const;

export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

/** Which of the room counts a category is asked for. */
export interface CategoryFields {
  bedrooms: boolean;
  livingRooms: boolean;
  halls: boolean;
  bathrooms: boolean;
}

const NONE: CategoryFields = {
  bedrooms: false,
  livingRooms: false,
  halls: false,
  bathrooms: false,
};

/** A dwelling: every room count applies. */
const DWELLING: CategoryFields = {
  bedrooms: true,
  livingRooms: true,
  halls: true,
  bathrooms: true,
};

/** Commercial space: no bedrooms, but bathrooms still matter. */
const COMMERCIAL: CategoryFields = {
  bedrooms: false,
  livingRooms: false,
  halls: false,
  bathrooms: true,
};

/** One open space — a studio or a single room. Only the bathroom is counted. */
const SINGLE_SPACE: CategoryFields = {
  bedrooms: false,
  livingRooms: false,
  halls: false,
  bathrooms: true,
};

export const CATEGORY_FIELDS: Record<PropertyCategory, CategoryFields> = {
  RESIDENTIAL_APARTMENT: DWELLING,
  FURNISHED_APARTMENT: DWELLING,
  VILLA: DWELLING,

  STUDIO: SINGLE_SPACE,
  ROOM: SINGLE_SPACE,
  FLOOR: DWELLING,
  CHALET: DWELLING,
  RESIDENTIAL_BUILDING: DWELLING,
  HOTEL: DWELLING,

  COMMERCIAL_BUILDING: COMMERCIAL,
  OFFICE: COMMERCIAL,
  SHOP: COMMERCIAL,
  WAREHOUSE: COMMERCIAL,

  // Land and farms are measured by area alone.
  FARM: NONE,
  RESIDENTIAL_LAND: NONE,
  COMMERCIAL_LAND: NONE,
  AGRICULTURAL_LAND: NONE,
};

/** Field rules for a category, defaulting to none for an unknown value. */
export function fieldsFor(category: string): CategoryFields {
  return CATEGORY_FIELDS[category as PropertyCategory] ?? NONE;
}

/** True when the category needs at least one room count. */
export function hasAnyRoomFields(category: string): boolean {
  const fields = fieldsFor(category);
  return (
    fields.bedrooms || fields.livingRooms || fields.halls || fields.bathrooms
  );
}

/** Translation key for a category label. */
export function categoryLabelKey(category: string): string {
  return `categories.${category}`;
}

/**
 * Values used before the type list was expanded, mapped to their replacements.
 * Kept so old rows, bookmarked filter URLs and the seed file keep working.
 */
export const LEGACY_CATEGORY_MAP: Record<string, PropertyCategory> = {
  APARTMENT: "RESIDENTIAL_APARTMENT",
  LAND: "RESIDENTIAL_LAND",
  ROOM: "ROOM",
  VILLA: "VILLA",
  OFFICE: "OFFICE",
};

/** Normalise a possibly-legacy category value. */
export function normaliseCategory(category: string): string {
  return LEGACY_CATEGORY_MAP[category] ?? category;
}

/**
 * Read a category from a URL search param, accepting legacy values so old
 * bookmarks and shared filter links keep working. Returns undefined for
 * anything unrecognised rather than filtering on a value no row can have.
 */
export function parseCategoryParam(
  value: string | undefined
): PropertyCategory | undefined {
  if (!value) return undefined;
  const normalised = normaliseCategory(value);
  return PROPERTY_CATEGORIES.includes(normalised as PropertyCategory)
    ? (normalised as PropertyCategory)
    : undefined;
}
