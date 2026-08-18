// Re-export model types from Prisma
export type {
  User,
  OtpSession,
  Property,
  PropertyImage,
  PropertyVideo,
  PropertyRequest,
  ManagementRequest,
  ContactMessage,
  Favorite,
} from "@/generated/prisma/client";

// App-level types
export type Locale = "ar" | "en";

// Enum types as string literals
// (SQLite doesn't support native enums — these match the Prisma schema comments)
export type UserRole = "USER" | "COMPANY_ADMIN";
export type PropertyType = "RENT" | "SALE";
export type PropertyStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PublisherType = "COMPANY" | "VERIFIED_USER";
export type ManagementStatus = "NEW" | "CONTACTED" | "CLOSED";

// Enum value arrays (useful for Zod schemas and dropdowns)
export const USER_ROLES = ["USER", "COMPANY_ADMIN"] as const;
// The category list and its per-category field rules live in
// lib/property-categories.ts; re-exported here so existing imports keep working.
export {
  PROPERTY_CATEGORIES,
  type PropertyCategory,
} from "@/lib/property-categories";
export const PROPERTY_TYPES = ["RENT", "SALE"] as const;
export const PROPERTY_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

/**
 * Set by the publisher when a deal closes. Separate from the moderation
 * status: a sold listing is still an approved one, it is simply no longer
 * available.
 */
export type DealStatus = "SOLD" | "RENTED";
export const DEAL_STATUSES = ["SOLD", "RENTED"] as const;

/** The deal state that matches a listing's purpose. */
export function dealStatusForType(type: string): DealStatus {
  return type === "RENT" ? "RENTED" : "SOLD";
}
export const PUBLISHER_TYPES = ["COMPANY", "VERIFIED_USER"] as const;
export const MANAGEMENT_STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;

// The compass direction a property faces (واجهة العقار)
export type PropertyFacade =
  | "NORTH"
  | "SOUTH"
  | "EAST"
  | "WEST"
  | "NORTH_EAST"
  | "NORTH_WEST"
  | "SOUTH_EAST"
  | "SOUTH_WEST";

export const PROPERTY_FACADES = [
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTH_EAST",
  "NORTH_WEST",
  "SOUTH_EAST",
  "SOUTH_WEST",
] as const;

/** Coarse age buckets used for filtering; `ageYears` stores the exact value. */
export const AGE_BUCKETS = [
  { value: "NEW", maxYears: 0 },
  { value: "UNDER_5", maxYears: 5 },
  { value: "UNDER_10", maxYears: 10 },
  { value: "OVER_10", maxYears: null },
] as const;
