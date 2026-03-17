const { z } = require("zod");
const { objectIdSchema } = require("./mongoId.validator");

// Reusable schemas for common fields
const modelSchema = z
  .string()
  .trim()
  .min(2, "Model name must be at least 2 characters")
  .max(100, "Model name must be at most 100 characters");

const totalPriceSchema = z.coerce
  .number()
  .positive("Total price must be positive")
  .max(100000000, "Total price must be at most ₹100,000,000");

const totalSharesSchema = z.coerce
  .number()
  .int("Total shares must be an integer")
  .min(1, "Total shares must be at least 1")
  .max(1000, "Total shares must be at most 1000");

const expectedMonthlyIncomeSchema = z.coerce
  .number()
  .min(0, "Expected monthly income cannot be negative")
  .max(100000, "Expected monthly income must be at most ₹100,000")
  .optional();

const imagesSchema = z.array(z.string().url("Invalid S3 URL")).optional();

// Schema for creating an EV (all fields required)
const EVSchemaCreate = z
  .object({
    model: modelSchema,
    totalPrice: totalPriceSchema,
    totalShares: totalSharesSchema,
    expectedMonthlyIncome: expectedMonthlyIncomeSchema,
    images: imagesSchema,
  })
  .strict();

// Schema for updating an EV (all fields optional)
const EVSchemaUpdate = z
  .object({
    model: modelSchema.optional(),
    totalPrice: totalPriceSchema.optional(),
    totalShares: totalSharesSchema.optional(),
    expectedMonthlyIncome: expectedMonthlyIncomeSchema.optional(),
  })
  .strict();

const listEVQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().trim().optional(),
    sort: z.enum(["totalPrice", "pricePerShare", "expectedMonthlyIncome", "createdAt"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    hasShares: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  })
  .strict();

const EVSchemaDelete = objectIdSchema;

module.exports = {
  EVSchemaCreate,
  EVSchemaUpdate,
  EVSchemaDelete,
  listEVQuerySchema,
};
