import { z } from "zod";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  PROPERTY_FACADES,
  PUBLISHER_TYPES,
} from "@/types";

// ============================================
// إنشاء / تعديل عقار
// ============================================
export const createPropertySchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters")
    .trim(),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be at most 5000 characters")
    .trim(),
  category: z.enum(PROPERTY_CATEGORIES),
  type: z.enum(PROPERTY_TYPES),
  price: z
    .number()
    .positive("Price must be a positive number")
    .max(999_999_999, "Price is too high"),
  area: z
    .number()
    .positive("Area must be a positive number")
    .max(100_000, "Area is too large"),
  bedrooms: z
    .number()
    .int()
    .min(0, "Bedrooms cannot be negative")
    .max(50, "Too many bedrooms")
    .default(0),
  livingRooms: z
    .number()
    .int()
    .min(0, "Living rooms cannot be negative")
    .max(50, "Too many living rooms")
    .default(0),
  halls: z
    .number()
    .int()
    .min(0, "Halls cannot be negative")
    .max(50, "Too many halls")
    .default(0),
  bathrooms: z
    .number()
    .int()
    .min(0, "Bathrooms cannot be negative")
    .max(50, "Too many bathrooms")
    .default(0),
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
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  formattedAddress: z.string().max(500).trim().optional(),

  // Empty strings survive form round-trips; treat them as "not provided".
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

  facade: z.enum(PROPERTY_FACADES).optional().or(z.literal("")),

  discountPercent: z
    .number()
    .min(1, "Discount must be at least 1%")
    .max(90, "Discount cannot exceed 90%")
    .optional(),

  // --- Legal status ---
  hasRestrictions: z.boolean().default(false),
  hasMortgage: z.boolean().default(false),
  hasWaqf: z.boolean().default(false),
  hasWill: z.boolean().default(false),
  registryRestrictions: z.string().max(1000).trim().optional().or(z.literal("")),
  obligations: z.string().max(1000).trim().optional().or(z.literal("")),

  publisherType: z.enum(PUBLISHER_TYPES),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = createPropertySchema.partial();

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

/**
 * What a publisher may change on their own live listing.
 *
 * Deliberately narrower than the create schema: status, publisher type and
 * ownership stay server-controlled, and a discount can be cleared by sending
 * null rather than omitting the field.
 */
export const editPropertySchema = createPropertySchema
  .omit({ publisherType: true })
  .partial()
  .extend({
    discountPercent: z
      .number()
      .min(1, "Discount must be at least 1%")
      .max(90, "Discount cannot exceed 90%")
      .nullable()
      .optional(),
  });

export type EditPropertyInput = z.infer<typeof editPropertySchema>;

// ============================================
// تعديل حالة العقار (Admin)
// ============================================
export const updatePropertyStatusSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"] as const),
    rejectionReason: z.string().max(500).optional(),
  })
  .refine(
    (data) =>
      data.status !== "REJECTED" ||
      (data.rejectionReason && data.rejectionReason.trim().length > 0),
    {
      message: "Rejection reason is required when rejecting",
      path: ["rejectionReason"],
    }
  );

export type UpdatePropertyStatusInput = z.infer<
  typeof updatePropertyStatusSchema
>;

// ============================================
// فلترة العقارات
// ============================================
export const propertyFiltersSchema = z.object({
  category: z.enum(PROPERTY_CATEGORIES).optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minArea: z.number().positive().optional(),
  maxArea: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(12),
});

export type PropertyFiltersInput = z.infer<typeof propertyFiltersSchema>;
