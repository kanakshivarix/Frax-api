const { logger } = require("../utils/helpers/logger.util");
const ApiError = require("./ApiErrors");

module.exports = (err, req, res, next) => {
  // JSON parse error (body-parser)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload",
      errors: [],
      data: null,
    });
  }

  const statusCode = err.statusCode || 500;

  logger.error("Unhandled error", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack,
  });

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err instanceof ApiError ? err.errors : [],
    data: null,
  });
};
