const { z } = require("zod");

const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must be at most 64 characters");

const emailSchema = z.string().trim().toLowerCase().email("Invalid email format");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{6,14}$/, "Phone number must be in E.164 format (e.g. +919876543210)");

const fullNameSchema = z
  .string()
  .trim()
  .min(3, "Full name must be at least 3 characters")
  .max(50, "Full name must be at most 50 characters");

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId");

module.exports = { passwordSchema, emailSchema, phoneSchema, fullNameSchema, objectIdSchema };
