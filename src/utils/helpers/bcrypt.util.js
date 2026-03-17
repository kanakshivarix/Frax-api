const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const ApiError = require("../../errors/ApiErrors"); // assuming your custom error class
const { KYC_ENCRYPTION_KEY } = require("../../configs/env.config");
const { saltRounds } = require("../../constants/app.constant");

// ────────────────────────────────────────────────
// Validate encryption key once at startup (fail fast)
const ENCRYPTION_KEY = Buffer.from(KYC_ENCRYPTION_KEY, "hex");

// ────────────────────────────────────────────────
const hashPassword = async (password) => {
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return bcrypt.compare(password, hashedPassword);
};

// ────────────────────────────────────────────────
// Encrypt sensitive field (PAN, Aadhaar number, bank account)
// Returns base64 string: iv (12B) + ciphertext + authTag (16B)
const encryptField = (value) => {
  if (value == null || value === "") return null;

  try {
    const iv = crypto.randomBytes(12); // GCM recommends 12 bytes
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(value, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag(); // 16 bytes integrity + auth

    // Format: iv + ciphertext + tag → base64 (easy to store in MongoDB string)
    return Buffer.concat([iv, encrypted, authTag]).toString("base64");
  } catch (err) {
    throw new ApiError(500, "Encryption failed");
  }
};

// ────────────────────────────────────────────────
// Decrypt field — throws on any tampering / wrong key / format error
const decryptField = (encryptedBase64) => {
  if (!encryptedBase64) return null;

  try {
    const data = Buffer.from(encryptedBase64, "base64");

    // Minimum length: iv(12) + tag(16) = 28 bytes
    if (data.length < 28) {
      throw new Error("Invalid encrypted data length");
    }

    const iv = data.subarray(0, 12);
    const authTag = data.subarray(data.length - 16);
    const ciphertext = data.subarray(12, data.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (err) {
    // In production: log full error internally, return generic message to client
    console.warn("[DECRYPTION FAILURE]", err.message);
    throw new ApiError(400, "Invalid or tampered encrypted value");
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  encryptField,
  decryptField,
};
