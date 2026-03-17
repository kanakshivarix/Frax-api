const { ZodError } = require("zod");
const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");

const REQUEST_TARGET = Object.freeze({
  BODY: "body",
  QUERY: "query",
  PARAMS: "params",
});

const validate =
  (schema, target = REQUEST_TARGET.BODY) =>
  async (req, res, next) => {
    try {
      if (!Object.values(REQUEST_TARGET).includes(target)) {
        throw new Error(`Invalid validation target: ${target}`);
      }

      if (!req[target]) {
        throw new ApiError(400, `Missing request ${target}`);
      }

      logger.debug("Validating request", {
        target,
        hasData: !!req[target],
        reqId: req.reqId || "N/A",
      });

      const parsedData = await schema.parseAsync(req[target]);

      // overwrite only after success
      req[target] = parsedData;

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => {
          const field = e.path.join(".");
          let message = e.message;

          if (e.code === "invalid_type" && e.received === "undefined") {
            message = `${field} is required`;
          } else if (e.code === "too_big") {
            message = `${field} is too long`;
          } else if (e.code === "too_small") {
            message = `${field} is too short`;
          }

          return { field, message };
        });

        // Log as info – client error, not system problem
        logger.info("Request validation failed", {
          target,
          errorCount: formattedErrors.length,
          fields: formattedErrors.map((e) => e.field),
        });

        return next(new ApiError(400, "Validation failed", formattedErrors));
      }

      logger.error("Unexpected error in validation middleware", {
        target,
        message: error.message,
        stack: error.stack,
      });

      return next(error);
    }
  };

module.exports = {
  validate,
  REQUEST_TARGET,
};
