const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const AREA_TYPES = [
  "Mall",
  "High Street",
  "IT Park",
  "Airport/Railway",
  "Residential",
  "College/University",
  "Other",
];

const CAFE_STATUSES = [
  "DRAFT",
  "REVIEW",
  "LIVE",
  "FULLY_FUNDED",
  "SPV_IN_PROCESS",
  "SPV_REGISTERED",
  "LAUNCH_IN_PROGRESS",
  "OPERATIONAL",
  "SUSPENDED",
  "CLOSED",
  "ARCHIVED",
];

module.exports = {
  cafeOutlet: z
    .object({
      // Identity
      outletName: z.string().trim().min(2).max(100),

      // Location
      city: z.string().trim().min(2),
      state: z.string().trim().min(2),

      pincode: z
        .string()
        .trim()
        .regex(/^[0-9]{6}$/, "Invalid pincode"),

      areaType: z.enum(AREA_TYPES),

      fullAddress: z.string().trim().min(3),

      // Financials (immutable later)
      totalSetupCost: z.number().positive(),
      pricePerShare: z.number().positive(),
      totalShares: z.number().int().positive(),

      minInvestmentShares: z.number().int().min(1).default(1),
      maxInvestmentSharesPerUser: z.number().int().min(1).default(500),

      expectedMonthlyProfit: z.number().min(0),
      projectedROI: z.number().min(0).max(100).optional(),

      // Physical
      carpetAreaSqFt: z.number().min(100).optional(),
      seatingCapacity: z.number().min(10).optional(),
      parkingAvailability: z.boolean().optional(),

      // Marketing
      shortDescription: z.string().trim().max(300).optional(),
      description: z.string().trim().optional(),
      highlights: z.array(z.string().trim().max(100)).default([]),

      // Dates
      estimatedLaunchDate: z.coerce.date(),
    })
    .strict()
    .superRefine((data, ctx) => {
      // Financial consistency
      if (data.pricePerShare * data.totalShares !== data.totalSetupCost) {
        ctx.addIssue({
          path: ["totalSetupCost"],
          message: "totalSetupCost must equal pricePerShare × totalShares",
        });
      }

      // Investment sanity
      if (data.minInvestmentShares > data.maxInvestmentSharesPerUser) {
        ctx.addIssue({
          path: ["minInvestmentShares"],
          message: "minInvestmentShares cannot exceed maxInvestmentSharesPerUser",
        });
      }
    }),

  cafeOutletImage: z.object({
    cafeOutletId: objectIdSchema,
  }),

  listCafes: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(20).default(10),

    search: z.string().trim().min(2).optional(),

    city: z.string().trim().min(2).optional(),
    areaType: z.enum(AREA_TYPES).optional(),
  }),

  listAdminCafes: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),

    search: z.string().trim().min(2).optional(),

    city: z.string().trim().min(2).optional(),
    areaType: z.enum(AREA_TYPES).optional(),
    status: z.enum(CAFE_STATUSES).optional(),
  }),
   updateStatus: z.object({
    status: z.enum(CAFE_STATUSES, {
      required_error: "status is required",
      invalid_type_error: "Invalid status value",
    }),
  }),
  updateCafeOutlet: z.object({
    outletName: z.string().trim().min(2).max(100).optional(),
    city: z.string().trim().min(2).optional(),
    state: z.string().trim().min(2).optional(),
    areaType: z.enum(AREA_TYPES).optional(),
    pincode: z.string().trim().regex(/^[0-9]{6}$/, "Invalid pincode").optional(),
    fullAddress: z.string().trim().min(3).optional(),
    minInvestmentShares: z.number().int().min(1).optional(),
    maxInvestmentSharesPerUser: z.number().int().min(1).optional(),
    expectedMonthlyProfit: z.number().min(0).optional(),
    projectedROI: z.number().min(0).max(100).optional(),
    carpetAreaSqFt: z.number().min(100).optional(),
    seatingCapacity: z.number().min(10).optional(),
    parkingAvailability: z.boolean().optional(),
    shortDescription: z.string().trim().max(300).optional(),
    description: z.string().trim().optional(),
    highlights: z.array(z.string().trim().max(100)).optional(),
    estimatedLaunchDate: z.coerce.date().optional(),
    actualLaunchDate: z.coerce.date().optional(),
    spvCompanyName: z.string().optional(),
    spvCIN: z.string().optional(),
    spvIncorporationDate: z.coerce.date().optional(),
    spvStatus: z.enum(["NOT_STARTED", "IN_PROCESS", "REGISTERED", "FAILED"]).optional(),
    status: z.enum(CAFE_STATUSES).optional()
  }).strict(),
 getById :z.object({cafeId: z.string().min(1)}),
};
