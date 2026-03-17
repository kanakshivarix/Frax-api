const { z } = require("zod");
const { objectIdSchema } = require("./mongoId.validator");

// Schema for buying shares
const ShareSchemaBuy = z
  .object({
    evId: objectIdSchema,
    shares: z.number().int("Shares must be an integer").min(1, "Must purchase at least 1 share"),
  })
  .strict();

module.exports = { ShareSchemaBuy };
