import { z } from "zod";

export const createContactMessageSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim(),
  email: z.email("Enter a valid email address").max(200).trim(),
  phone: z
    .string()
    .regex(/^05\d{8}$/, "Phone must be a valid Saudi number starting with 05")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .min(2, "Subject is required")
    .max(200, "Subject is too long")
    .trim(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long")
    .trim(),
});

export type CreateContactMessageInput = z.infer<
  typeof createContactMessageSchema
>;
