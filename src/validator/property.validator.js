const { z } = require("zod");

const areaSchema = z.object({
  value: z.number(),
  unit: z.enum(["sqft", "acre", "hectare", "sqyd"]),
}).strict();

const locationSchema = z.object({
  address: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string().optional(),
  coordinates: z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
}).strict();

const ownerDetailsSchema = z.object({
  name: z.string().optional(),
  contact: z.string().optional(),
}).strict();

const createPropertySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  price: z.number(),
  pricePerUnit: z.number().optional(),
  area: areaSchema,
  landType: z.enum(["residential", "commercial", "agricultural", "industrial"]),
  ownershipType: z.enum(["freehold", "leasehold"]).optional(),
  location: locationSchema,
  amenities: z.array(z.enum(["road_access", "water", "electricity", "drainage", "boundary_wall"])).optional(),
  tags: z.array(z.string()).optional(),
  ownerDetails: ownerDetailsSchema.optional(),
  isVerified: z.boolean().optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  status: z.enum(["available", "sold", "pending"]).optional(),
}).strict();

const updatePropertySchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  pricePerUnit: z.number().optional(),
  area: areaSchema.optional(),
  landType: z.enum(["residential", "commercial", "agricultural", "industrial"]).optional(),
  ownershipType: z.enum(["freehold", "leasehold"]).optional(),
  location: locationSchema.optional(),
  amenities: z.array(z.enum(["road_access", "water", "electricity", "drainage", "boundary_wall"])).optional(),
  tags: z.array(z.string()).optional(),
  ownerDetails: ownerDetailsSchema.optional(),
  isVerified: z.boolean().optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  status: z.enum(["available", "sold", "pending"]).optional(),
}).strict();

module.exports = {
  createPropertySchema,
  updatePropertySchema,
};
