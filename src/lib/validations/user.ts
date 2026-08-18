import { z } from "zod";

// ============================================
// تعديل الملف الشخصي
// ============================================
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .trim(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
