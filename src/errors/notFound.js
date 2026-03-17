const { logger } = require("../utils/helpers/logger.util");

const notFound = (req, res) => {
  logger.debug("Route not found", { method: req.method, path: req.originalUrl });
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

module.exports = notFound;
