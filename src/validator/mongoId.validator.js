const { z } = require("zod");

const objectIdSchema = z.string().refine((id) => /^[0-9a-fA-F]{24}$/.test(id), {
  message: "Invalid MongoDB ObjectId",
});

module.exports = { objectIdSchema };
