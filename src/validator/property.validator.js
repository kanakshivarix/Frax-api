const { z } = require("zod");

const areaSchema = z
  .object({
    value: z.number(),
    unit: z.enum(["sqft", "acre", "hectare", "sqyd"]),
  })
  .strict();

const locationSchema = z
  .object({
    address: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  })
  .strict();

const ownerDetailsSchema = z
  .object({
    name: z.string().optional(),
    contact: z.string().optional(),
  })
  .strict();

const createPropertySchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().optional(),
    price: z.number(),
    totalShares: z.number().min(1),
    soldShares: z.number().min(0).optional(),
    pricePerShare: z.number().optional(),

    minInvestmentShares: z.number().min(1).optional(),
    maxInvestmentSharesPerUser: z.number().min(1).optional(),

    area: areaSchema,
    landType: z.enum([
      "residential",
      "commercial",
      "agricultural",
      "industrial",
    ]),
    ownershipType: z.enum(["freehold", "leasehold"]).optional(),
    location: locationSchema,
    amenities: z
      .array(
        z.enum([
          "road_access",
          "water",
          "electricity",
          "drainage",
          "boundary_wall",
        ]),
      )
      .optional(),
    tags: z.array(z.string()).optional(),
    ownerDetails: ownerDetailsSchema.optional(),
    isVerified: z.boolean().optional(),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    status: z.enum(["available", "sold", "pending"]).optional(),
    isHighlighted: z.boolean().optional(),
  })
  .strict();

const updatePropertySchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    area: areaSchema.optional(),
    landType: z
      .enum(["residential", "commercial", "agricultural", "industrial"])
      .optional(),
    ownershipType: z.enum(["freehold", "leasehold"]).optional(),
    location: locationSchema.optional(),
    amenities: z
      .array(
        z.enum([
          "road_access",
          "water",
          "electricity",
          "drainage",
          "boundary_wall",
        ]),
      )
      .optional(),
    tags: z.array(z.string()).optional(),
    ownerDetails: ownerDetailsSchema.optional(),
    isVerified: z.boolean().optional(),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    totalShares: z.number().min(1).optional(),
    soldShares: z.number().min(0).optional(),
    pricePerShare: z.number().optional(),

    minInvestmentShares: z.number().min(1).optional(),
    maxInvestmentSharesPerUser: z.number().min(1).optional(),
    status: z.enum(["available", "sold", "pending"]).optional(),
    isHighlighted: z.boolean().optional(),
  })
  .strict();

module.exports = {
  createPropertySchema,
  updatePropertySchema,
};
