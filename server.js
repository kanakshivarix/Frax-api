const express = require("express");
const helmet = require("helmet");

const cors = require("cors");

const notFound = require("./src/errors/notFound");
const errorHandler = require("./src/errors/ErrorHandler");

const responseMiddleware = require("./src/middlewares/response.middleware");
const { generalLimiter } = require("./src/middlewares/rateLimit.middleware");
const { requestContextMiddleware } = require("./src/middlewares/requestContext.middleware");

const { morganMiddleware } = require("./src/utils/helpers/logger.util");
const { JSON_LIMIT } = require("./src/constants/app.constant");
const { corsOptions } = require("./src/configs/cors.config");

// @routes
const MainRoutes = require("./src/routes/index.routes");
const multerErrorMiddleware = require("./src/middlewares/multerError.middleware");
const { S3_BASE_URL } = require("./src/configs/aws.config");

const server = express();
server.set("trust proxy", 1);

server.use(requestContextMiddleware);

// 1. CORS (preflight must pass before rate limiting)
server.use(cors(corsOptions));

// 2. Security headers
server.use(helmet());

// 3. GLOBAL rate limiter (applies to all requests)
server.use(generalLimiter);

// 4. Body parsers (expensive, keep after limiter)
server.use(
  express.json({
    limit: JSON_LIMIT,
    verify: (req, res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  }),
);

server.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));
server.use(morganMiddleware);
server.use(responseMiddleware);

server.use("/api/v1", MainRoutes);

server.use(multerErrorMiddleware);
server.use(errorHandler);

server.use(notFound);

module.exports = server;
