const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");
const { KYC_STATUS } = require("../constants/app.constant");

const panNumberSchema = z.string().trim().length(10, "Invalid PAN number");

const aadhaarNumberSchema = z.string().trim().length(12, "Invalid Aadhaar number");

module.exports = {
  list: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),

    status: z.enum(Object.values(KYC_STATUS)).optional(),

    search: z.string().trim().min(2).optional(), // phone / email / name
  }),

  getOne: z.object({
    userId: objectIdSchema,
  }),
  submitPan: z
    .object({
      panNumber: panNumberSchema,
    })
    .strict(),

  submitAadhaar: z
    .object({
      aadhaarNumber: aadhaarNumberSchema,
    })
    .strict(),

  submitBank: z
    .object({
      accountNumber: z.string().trim().min(6),
      ifscCode: z.string().trim().length(11),
      bankName: z.string().trim().min(2),
      accountHolderName: z.string().trim().min(2),
    })
    .strict(),

  submitAddress: z.object({
    street: z.string().trim().min(5),
    city: z.string().trim().min(2),
    state: z.string().trim().min(2),
    postalCode: z.string().trim().min(4),
  }),

  updateKycStepSchema: z
    .object({
      userId: objectIdSchema,

      step: z.enum(["pan", "aadhaar", "bankDetails","selfie"]),

      status: z.enum([KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED]),

      rejectionReason: z.string().trim().min(3).optional(),
    })
    .superRefine((data, ctx) => {
      // rejectionReason is mandatory only when status = REJECTED
      if (data.status === KYC_STATUS.REJECTED && !data.rejectionReason) {
        ctx.addIssue({
          path: ["rejectionReason"],
          message: "Rejection reason is required when status is REJECTED",
        });
      }

      // rejectionReason must NOT be sent when status = VERIFIED
      if (data.status === KYC_STATUS.VERIFIED && data.rejectionReason) {
        ctx.addIssue({
          path: ["rejectionReason"],
          message: "Rejection reason is not allowed when status is VERIFIED",
        });
      }
    }),
};
