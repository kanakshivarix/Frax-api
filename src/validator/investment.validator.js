const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

module.exports = {
  createInvestment: z
    .object({
      outletId: objectIdSchema,
      shares: z.coerce
        .number({
          invalid_type_error: "Shares must be a number",
        })
        .int("Shares must be an integer")
        .min(1, "At least 1 share must be purchased"),
      utr: z
        .string({
          required_error: "UTR is required",
        })
        .trim()
        .min(6, "UTR must be at least 6 characters"),

      paidAt: z.coerce.date().optional().default(new Date()),
     })
  .strict(), 

  approveInvestment: z
    .object({
      investmentId: objectIdSchema,
    })
    .strict(),

  rejectInvestmentParams: z
    .object({
      investmentId: objectIdSchema,
    })
    .strict(),

  rejectInvestmentBody: z
    .object({
      reason: z
        .string({ required_error: "Rejection reason is required" })
        .trim()
        .min(1, "Rejection reason must be at least 1 characters"),
    })
    .strict(),
  //Admin
  listInvestments: z
    .object({
      status: z.enum(["PAYMENT_UPLOADED", "ADMIN_APPROVED", "ADMIN_REJECTED"]).optional(),

      outletId: objectIdSchema.optional(),

      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(50).default(10),
    })
    .strict(),
  //Admin
  getInvestment: z
    .object({
      investmentId: objectIdSchema,
    })
    .strict(),

  //User
  listMyInvestments: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(20).default(10),
    })
    .strict(),

  //User
  getMyInvestment: z
    .object({
      investmentId: objectIdSchema,
    })
    .strict(),
};
