const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");

const allowed =
  (...allowed) =>
  (req, res, next) => {
    if (!req.user) {
      logger.debug("checkRole called without user in request", {
        path: req.originalUrl,
        method: req.method,
      });
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!allowed.includes(req.user.role)) {
      logger.debug("Access denied", {
        path: req.originalUrl,
        method: req.method,
        userRole: req.user.role,
        allowed,
      });

      return next(new ApiError(403, "Access denied"));
    }

    next();
  };

module.exports = allowed;
