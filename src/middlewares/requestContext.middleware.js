const crypto = require("crypto");
const requestContext = require("../configs/requestContext.config");
/**
 * Request Context Middleware
 * - Creates a per-request async context
 * - Attaches a requestId for tracing logs
 */
const requestContextMiddleware = (req, res, next) => {
  const reqId = req.headers["x-request-id"] || crypto.randomUUID();

  requestContext.run({ reqId }, () => {
    next();
  });
};

module.exports = {
  requestContextMiddleware,
};
