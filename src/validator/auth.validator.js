const { z } = require("zod");
const {
  passwordSchema,
  emailSchema,
  phoneSchema,
} = require("./common.validator");

module.exports = {
  sendOtp: z
    .object({
      phone: phoneSchema,
      referralCode: z.string().trim().optional(),

      consents: z
        .object({
          isAdult: z.boolean().optional(),
          acceptTerms: z.boolean().optional(),
          understandRisk: z.boolean().optional(),
          kycAgree: z.boolean().optional(),
          fundsLegal: z.boolean().optional(),
          notProxy: z.boolean().optional(),
        })
        .optional(),
    })
    .strict(),

  resendOtp: z
    .object({
      phone: phoneSchema,
    })
    .strict(),

  verifyOtp: z
    .object({
      phone: phoneSchema,
      otp: z.string().length(6, "OTP must be 6 digits"),
    })
    .strict(),

  initiateEmailVerification: z
    .object({
      email: emailSchema,
    })
    .strict(),

  verifyEmail: z
    .object({
      token: z.string().uuid(),
    })
    .strict(),

  register: z
    .object({
      password: passwordSchema,
      email: emailSchema,
      phone: phoneSchema,
      firstName: z
        .string()
        .min(2, "First name can not be less than 2 character")
        .max(50, "First name can not be more than 50 character"),

      lastName: z
        .string()
        .min(2, "Last name can not be less than 2 character")
        .max(50, "Last name can not be more than 50 character"),
    })
    .strict(),

  registerWithReferralCode: z
    .object({
      referralCode: z
        .string()
        .length(8, "referralCode must be 8 character")
        .optional(),
    })
    .strict(),

  login: z
    .object({
      email: emailSchema,
      password: passwordSchema,
    })
    .strict(),

  resetPassword: z
    .object({
      token: z.string().min(10, "Invalid token").max(100, "Invalid token"),
      newPassword: passwordSchema,
    })
    .strict(),
};
