const multer = require("multer");
const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");

/**
 * Multer-specific error handler middleware
 * Catches Multer errors early and converts them to consistent ApiError format
 * Should be placed **right after** your multer upload middleware(s)
 * and **before** the general error handler
 */
module.exports = (err, req, res, next) => {
  // Not a Multer error → pass to next error handler
  if (!(err instanceof multer.MulterError)) {
    return next(err);
  }

  // ────────────────────────────────────────────────
  // Common Multer errors → map to user-friendly messages
  // ────────────────────────────────────────────────
  let statusCode = 400;
  let message = "File upload error";
  let errorCode = "FILE_UPLOAD_FAILED";

  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      statusCode = 413;
      message = "File too large";
      errorCode = "FILE_TOO_LARGE";
      break;

    case "LIMIT_UNEXPECTED_FILE":
      message = "Unexpected field name in form-data";
      errorCode = "UNEXPECTED_FIELD";
      break;

    case "LIMIT_FILE_COUNT":
      message = "Too many files uploaded";
      errorCode = "TOO_MANY_FILES";
      break;

    case "LIMIT_PART_COUNT":
      message = "Too many form parts";
      errorCode = "TOO_MANY_PARTS";
      break;

    case "LIMIT_FIELD_KEY":
    case "LIMIT_FIELD_VALUE":
    case "LIMIT_FIELD_COUNT":
      message = "Form data limit exceeded";
      errorCode = "FORM_DATA_LIMIT_EXCEEDED";
      break;

    case "LIMIT_MULTIPART_COUNT":
      message = "Multipart form data limit exceeded";
      errorCode = "MULTIPART_LIMIT_EXCEEDED";
      break;

    default:
      // Unknown Multer error – log it
      logger.error("[Multer Error]", {
        code: err.code,
        message: err.message,
        field: err.field,
        stack: err.stack?.split("\n").slice(0, 4).join("\n"),
      });
      message = "Invalid file upload";
  }

  // For files rejected by fileFilter (custom rejection)
  if (err.message && err.code === "LIMIT_UNEXPECTED_FILE" && err.field) {
    message = `Invalid field: ${err.field}`;
  }

  const apiError = new ApiError(statusCode, message, {
    code: errorCode,
    details: err.code ? { multerCode: err.code } : undefined,
  });

  next(apiError);
};
