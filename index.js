const server = require("./server.js");
const { PORT } = require("./src/configs/env.config.js");
const { logger } = require("./src/utils/helpers/logger.util.js");
const { connectToMongoDB } = require("./src/configs/db.config.js");

let httpServer;

/**
 * Graceful shutdown
 */
const shutdown = (signal) => {
  logger.warn(`Received ${signal}. Shutting down gracefully...`);

  if (httpServer) {
    httpServer.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  }

  // Force exit if shutdown hangs
  setTimeout(() => {
    logger.error("Force shutdown after timeout");
    process.exit(1);
  }, 10000);
};

/**
 * Bootstrap application
 */
(async () => {
  try {
    // 1. Connect DB first
    await connectToMongoDB();

    // 2. Start server only after DB is ready
    httpServer = server.listen(PORT, () => {
      logger.info(`Server running at http://localhost:${PORT}`);
    });
    httpServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        logger.error(`Port ${PORT} already in use. Exiting.`);
      } else {
        logger.error("HTTP server error", err);
      }
      process.exit(1);
    });
  } catch (err) {
    logger.error("Startup failure. Application will exit.", err);
    process.exit(1);
  }
})();

/**
 * HTTP server-level errors (port, socket, etc.)
 */
server.on("error", (err) => {
  logger.error("HTTP server error", err);
  process.exit(1);
});

/**
 * Uncaught synchronous errors
 */
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception — process will exit", err);
  process.exit(1);
});

/**
 * Unhandled promise rejections
 */
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
  process.exit(1);
});

/**
 * OS shutdown signals
 */
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
