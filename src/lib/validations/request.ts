import { z } from "zod";
import { PROPERTY_TYPES, PUBLISHER_TYPES } from "@/types";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";

/** A room count on a request: optional, since it depends on the category. */
const ROOM_COUNT = z.number().int().min(0).max(50).optional();

// ============================================
// طلب عقار (العقارات المطلوبة)
// ============================================
export const createPropertyRequestSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  category: z.enum(PROPERTY_CATEGORIES),

  /** Whether the requester wants to buy or to rent. */
  type: z.enum(PROPERTY_TYPES).default("SALE"),

  // Room counts are optional: the form only sends the ones the chosen
  // category actually asks for.
  bedrooms: ROOM_COUNT,
  livingRooms: ROOM_COUNT,
  halls: ROOM_COUNT,
  bathrooms: ROOM_COUNT,

  city: z
    .string()
    .min(2, "City is required")
    .max(100, "City name too long")
    .trim(),
  district: z
    .string()
    .min(2, "District is required")
    .max(100, "District name too long")
    .trim(),
  region: z.string().max(100).trim().optional(),

  // Where on the map the requester is looking — optional, like on a listing.
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  formattedAddress: z.string().max(500).trim().optional(),

  budget: z
    .number()
    .positive("Budget must be a positive number")
    .max(999_999_999, "Budget is too high"),

  whatsapp: z
    .string()
    .regex(/^05\d{8}$/, "WhatsApp must be a valid Saudi number starting with 05")
    .optional()
    .or(z.literal("")),

  ageYears: z
    .number()
    .int()
    .min(0, "Age cannot be negative")
    .max(100, "Age is too large")
    .optional(),

  publisherType: z.enum(PUBLISHER_TYPES),
});

export type CreatePropertyRequestInput = z.infer<
  typeof createPropertyRequestSchema
>;

// ============================================
// طلب إدارة أملاك
// ============================================
export const createManagementRequestSchema = z.object({
  ownerName: z
    .string()
    .min(2, "Owner name must be at least 2 characters")
    .max(100, "Owner name too long")
    .trim(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^05\d{8}$/,
      "Phone must be a valid Saudi number starting with 05 (10 digits)"
    ),
  propertyType: z
    .string()
    .min(2, "Property type is required")
    .max(100, "Property type too long")
    .trim(),
  city: z
    .string()
    .min(2, "City is required")
    .max(100, "City name too long")
    .trim(),
  district: z
    .string()
    .min(2, "District is required")
    .max(100, "District name too long")
    .trim(),
  notes: z
    .string()
    .max(2000, "Notes must be at most 2000 characters")
    .trim()
    .optional(),
});

export type CreateManagementRequestInput = z.infer<
  typeof createManagementRequestSchema
>;

// ============================================
// طلب تسويق عقار
// ============================================
export const createMarketingRequestSchema = z.object({
  ownerName: z
    .string()
    .min(2, "Owner name must be at least 2 characters")
    .max(100, "Owner name too long")
    .trim(),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^05\d{8}$/,
      "Phone must be a valid Saudi number starting with 05 (10 digits)"
    ),
  whatsapp: z
    .string()
    .regex(/^05\d{8}$/, "WhatsApp must be a valid Saudi number starting with 05")
    .optional()
    .or(z.literal("")),

  category: z.enum(PROPERTY_CATEGORIES),
  /** Marketing the property for sale or for rent. */
  purpose: z.enum(PROPERTY_TYPES).default("SALE"),

  region: z.string().max(100).trim().optional(),
  city: z
    .string()
    .min(2, "City is required")
    .max(100, "City name too long")
    .trim(),
  district: z
    .string()
    .min(2, "District is required")
    .max(100, "District name too long")
    .trim(),

  area: z.number().positive().max(100_000, "Area is too large").optional(),
  expectedPrice: z
    .number()
    .positive()
    .max(999_999_999, "Price is too high")
    .optional(),

  notes: z
    .string()
    .max(2000, "Notes must be at most 2000 characters")
    .trim()
    .optional(),
});

export type CreateMarketingRequestInput = z.infer<
  typeof createMarketingRequestSchema
>;
