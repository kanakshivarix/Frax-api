require("dotenv").config();
const { z } = require("zod");

/**
 * =========================
 * ENV SCHEMA
 * =========================
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(3001),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  DB_NAME: z.string().min(1, "DB_NAME is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  REFRESH_SECRET: z.string().min(32, "REFRESH_SECRET must be at least 32 characters"),

  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  EMAIL_USER: z.string().email("EMAIL_USER must be a valid email"),
  EMAIL_PASS: z.string().min(1, "EMAIL_PASS is required"),

  KYC_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, "KYC_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)"),

  AWS_REGION: z.string().min(1, "AWS_REGION is required"),
  AWS_ACCESS_KEY_ID: z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
  AWS_S3_BUCKET_NAME: z.string().min(1, "AWS_S3_BUCKET_NAME is required"),

  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),
  ADMIN_PASS: z.string().min(4, "ADMIN_PASS must be at least 4 characters"),
  ADMIN_PHONE:z.string()
});

/**
 * =========================
 * PARSE & FAIL FAST
 * =========================
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Invalid environment variables:\n");

  parsed.error.errors.forEach((err) => {
    console.error(`- ${err.path.join(".")}: ${err.message}`);
  });

  console.error("\nFix the above errors and restart the server.\n");
  process.exit(1); // HARD FAIL
}

/**
 * =========================
 * FINAL CONFIG (IMMUTABLE)
 * =========================
 */
const config = Object.freeze(parsed.data);

module.exports = config;
