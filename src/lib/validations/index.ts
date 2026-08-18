// Auth validations
export {
  sendOtpSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  completeProfileSchema,
  type SendOtpInput,
  type LoginInput,
  type RegisterInput,
  type ResetPasswordInput,
  type CompleteProfileInput,
} from "./auth";

// Property validations
export {
  createPropertySchema,
  updatePropertySchema,
  updatePropertyStatusSchema,
  propertyFiltersSchema,
  type CreatePropertyInput,
  type UpdatePropertyInput,
  type UpdatePropertyStatusInput,
  type PropertyFiltersInput,
} from "./property";

// Request validations
export {
  createPropertyRequestSchema,
  createManagementRequestSchema,
  type CreatePropertyRequestInput,
  type CreateManagementRequestInput,
} from "./request";

// User validations
export {
  updateProfileSchema,
  type UpdateProfileInput,
} from "./user";
