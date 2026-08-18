import { z } from "zod";

/**
 * Three separate intents. Signing in with an unknown number should say so
 * rather than silently create an account; registering a number that already
 * exists should point the person at sign-in; and resetting only makes sense
 * for a number that does exist.
 */
export const AUTH_MODES = ["login", "register", "reset"] as const;
export type AuthMode = (typeof AUTH_MODES)[number];

/** Modes that need a verification code — signing in uses the password. */
export const OTP_MODES = ["register", "reset"] as const;

const phoneField = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^05\d{8}$/,
    "Phone must be a valid Saudi number starting with 05 (10 digits)"
  );

const nameField = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters")
  .trim();

// ============================================
// كلمة المرور
// ============================================

/** The rules, in one place, so the form and the server never disagree. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export const PASSWORD_RULES = {
  length: (v: string) =>
    v.length >= PASSWORD_MIN_LENGTH && v.length <= PASSWORD_MAX_LENGTH,
  letter: (v: string) => /[A-Za-z؀-ۿ]/.test(v),
  digit: (v: string) => /\d/.test(v),
  symbol: (v: string) => /[^A-Za-z0-9؀-ۿ\s]/.test(v),
} as const;

export type PasswordRule = keyof typeof PASSWORD_RULES;

export const PASSWORD_RULE_ORDER: readonly PasswordRule[] = [
  "length",
  "letter",
  "digit",
  "symbol",
];

/** Which rules a candidate password already satisfies. */
export function checkPassword(value: string): Record<PasswordRule, boolean> {
  return {
    length: PASSWORD_RULES.length(value),
    letter: PASSWORD_RULES.letter(value),
    digit: PASSWORD_RULES.digit(value),
    symbol: PASSWORD_RULES.symbol(value),
  };
}

export function isStrongPassword(value: string): boolean {
  return PASSWORD_RULE_ORDER.every((rule) => PASSWORD_RULES[rule](value));
}

/**
 * A password must mix letters, digits and symbols. The message names every
 * failing rule at once rather than one per submit.
 */
const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .refine(PASSWORD_RULES.letter, "Password must contain a letter")
  .refine(PASSWORD_RULES.digit, "Password must contain a digit")
  .refine(PASSWORD_RULES.symbol, "Password must contain a symbol");

/** Reused by both schemas that set a password. */
const confirmationRefinement = {
  message: "Passwords do not match",
  path: ["confirmPassword"] as const,
};

// ============================================
// OTP — طلب رمز التحقق
// ============================================
export const sendOtpSchema = z.object({
  phone: phoneField,
  /** Only registration and reset send a code; sign-in uses the password. */
  mode: z.enum(OTP_MODES),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

const otpCodeField = z
  .string()
  .length(4, "OTP code must be 4 digits")
  .regex(/^\d{4}$/, "OTP code must contain only digits");

// ============================================
// إنشاء حساب — التحقق من الرمز وتعيين كلمة المرور
// ============================================
export const registerSchema = z
  .object({
    phone: phoneField,
    code: otpCodeField,
    name: nameField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    ...confirmationRefinement,
    path: [...confirmationRefinement.path],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// تسجيل الدخول بكلمة المرور
// ============================================
export const loginSchema = z.object({
  phone: phoneField,
  // Not validated for strength: an old password that no longer meets the
  // rules must still be able to sign in and then be changed.
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// استعادة كلمة المرور
// ============================================
export const resetPasswordSchema = z
  .object({
    phone: phoneField,
    code: otpCodeField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    ...confirmationRefinement,
    path: [...confirmationRefinement.path],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================
// التسجيل — إكمال الملف الشخصي بعد OTP
// ============================================
export const completeProfileSchema = z.object({
  name: nameField,
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
