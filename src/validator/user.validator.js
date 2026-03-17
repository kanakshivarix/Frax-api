const { z } = require("zod");
const { passwordSchema, phoneSchema, fullNameSchema } = require("./common.validator");

/**
 * Action-based schemas
 */
module.exports = {
  updateProfile: z
    .object({
      fullname: fullNameSchema.optional(),
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
      address: z.string().trim().min(5, "Address must be at least 5 characters"),
      country: z.string().trim().min(2, "Country is required"),
      state: z.string().trim().min(2, "State is required"),
      city: z.string().trim().min(2, "City is required"),
      zipCode: z.string().trim().min(3, "Invalid zip code"),
    })
    .strict(),
};
