const crypto = require("crypto");
const ApiError = require("../../errors/ApiErrors");

/**
 * Generate checksum for a buffer
 * Default: sha256 (strong, fast, industry standard)
 */
const generateChecksum = (buffer, algo = "sha256") => {
  if (!Buffer.isBuffer(buffer)) {
    throw new ApiError(500, "Checksum generation requires a Buffer");
  }

  return crypto.createHash(algo).update(buffer).digest("hex");
};

module.exports = {
  generateChecksum,
};
