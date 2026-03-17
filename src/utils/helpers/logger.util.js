const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const { IsDevelopment } = require("../../configs/app.config");
const requestContext = require("../../configs/requestContext.config");

/* ============================
   ROOT-LEVEL LOG DIRECTORY
============================ */
const ROOT_DIR = process.cwd();
const LOGS_DIR = path.join(ROOT_DIR, "logs");

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/* ============================
   FORMATS
============================ */

// File logs → JSON (machine readable)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `[${timestamp}] ${level}: ${message}`;

    if (Object.keys(meta).length) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  }),
);

/* ============================
   TRANSPORTS
============================ */
const transports = [
  new DailyRotateFile({
    level: "error",
    filename: path.join(LOGS_DIR, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
  }),

  new DailyRotateFile({
    level: "info",
    filename: path.join(LOGS_DIR, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d",
    format: fileFormat,
  }),
];

// Console logging only in development
if (IsDevelopment) {
  transports.push(
    new winston.transports.Console({
      level: "debug",
      format: consoleFormat,
    }),
  );
}

/* ============================
   LOGGER INSTANCE
============================ */
const logger = winston.createLogger({
  level: IsDevelopment ? "debug" : "info",
  defaultMeta: {
    get reqId() {
      return requestContext.getStore()?.reqId;
    },
  },
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOGS_DIR, "exceptions-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      format: fileFormat,
    }),
    ...(IsDevelopment ? [new winston.transports.Console()] : []),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOGS_DIR, "rejections-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      format: fileFormat,
    }),
    ...(IsDevelopment ? [new winston.transports.Console()] : []),
  ],
  exitOnError: false,
});

/* ============================
   MORGAN INTEGRATION
============================ */
const morganMiddleware = morgan(":method :url :status :response-time ms - :res[content-length]", {
  stream: {
    write: (message) => logger.http(message.trim()),
  },
});

module.exports = {
  logger,
  morganMiddleware,
};
