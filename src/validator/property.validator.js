const { z } = require("zod");
const { objectIdSchema } = require("./common.validator");

const PROPERTY_STATUSES = [
  "available",
  "sold",
  "pending",
];

const LAND_TYPES = ["residential", "commercial", "agricultural", "industrial"];
const OWNERSHIP_TYPES = ["freehold", "leasehold"];
const AREA_UNITS = ["sqft", "acre", "hectare", "sqyd"];
const AMENITIES = ["road_access", "water", "electricity", "drainage", "boundary_wall"];

module.exports = {
  property: z
    .object({
      title: z.string().trim().min(2).max(200),
      description: z.string().trim().optional(),
      price: z.number().positive(),
      pricePerUnit: z.number().positive().optional(),
      
      area: z.object({
        value: z.number().positive(),
        unit: z.enum(AREA_UNITS),
      }).optional(),

      landType: z.enum(LAND_TYPES),
      ownershipType: z.enum(OWNERSHIP_TYPES).optional(),

      location: z.object({
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        coordinates: z.object({
          lat: z.number().optional(),
          lng: z.number().optional(),
        }).optional(),
      }).optional(),

      amenities: z.array(z.enum(AMENITIES)).optional(),
      images: z.any().optional(),
      
      documents: z.any().optional(),

      tags: z.array(z.string()).optional(),

      isVerified: z.boolean().optional(),
      approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),

      listedBy: z.object({
        userId: objectIdSchema.optional(),
        name: z.string().optional(),
        contact: z.string().optional(),
      }).optional(),

      ownerDetails: z.object({
        name: z.string().optional(),
        contact: z.string().optional(),
      }).optional(),

      status: z.enum(PROPERTY_STATUSES).optional(),
    }),

  propertyImage: z.object({
    propertyId: objectIdSchema,
  }),

  listProperties: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(20).default(10),
    search: z.string().trim().min(2).optional(),
    city: z.string().trim().min(2).optional(),
    landType: z.enum(LAND_TYPES).optional(),
  }),

  listAdminProperties: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    search: z.string().trim().min(2).optional(),
    city: z.string().trim().min(2).optional(),
    landType: z.enum(LAND_TYPES).optional(),
    status: z.enum(PROPERTY_STATUSES).optional(),
  }),

  updateStatus: z.object({
    status: z.enum(PROPERTY_STATUSES, {
      required_error: "status is required",
      invalid_type_error: "Invalid status value",
    }),
  }),

  updateProperty: z.object({
    title: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().optional(),
    price: z.number().positive().optional(),
    pricePerUnit: z.number().positive().optional(),
    area: z.object({
      value: z.number().positive(),
      unit: z.enum(AREA_UNITS),
    }).optional(),
    landType: z.enum(LAND_TYPES).optional(),
    ownershipType: z.enum(OWNERSHIP_TYPES).optional(),
    location: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      coordinates: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
      }).optional(),
    }).optional(),
    amenities: z.array(z.enum(AMENITIES)).optional(),
    images: z.any().optional(),
    documents: z.any().optional(),
    tags: z.array(z.string()).optional(),
    isVerified: z.boolean().optional(),
    approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    status: z.enum(PROPERTY_STATUSES).optional()
  }).strict(),
  
  getById :z.object({propertyId: z.string().min(1)}),
};
