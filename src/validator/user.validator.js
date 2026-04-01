const { z } = require("zod");
const {
  passwordSchema,
  phoneSchema,
  firstNameSchema,
  lastNameSchema,
} = require("./common.validator");

/**
 * Action-based schemas
 */
module.exports = {
  updateProfile: z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be at most 50 characters")
      .optional(),

    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be at most 50 characters")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .optional(),

    address: z
      .string()
      .trim()
      .min(5, "Address must be at least 5 characters")
      .optional(),

    accountNumber: z
      .string()
      .trim()
      .min(9, "Invalid account number")
      .max(18, "Invalid account number")
      .optional(),

    ifscCode: z
      .string()
      .trim()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code")
      .optional(),
      phone: phoneSchema.optional(),
  })
  .strict(),
  changePassword: z
    .object({
      currentPassword: passwordSchema,
      newPassword: passwordSchema,
    })
    .strict(),

  changePhone: z
    .object({
      phone: phoneSchema, // E.164 only
    })
    .strict(),

  disableAccount: z
    .object({
      phone: phoneSchema, // confirmation via OTP flow
    })
    .strict(),

  billing: z
    .object({
      gstNo: z.string().trim().optional(),
      company: z.string().trim().optional(),
      address: z
        .string()
        .trim()
        .min(5, "Address must be at least 5 characters"),
      country: z.string().trim().min(2, "Country is required"),
      state: z.string().trim().min(2, "State is required"),
      city: z.string().trim().min(2, "City is required"),
      zipCode: z.string().trim().min(3, "Invalid zip code"),
    })
    .strict(),
};
