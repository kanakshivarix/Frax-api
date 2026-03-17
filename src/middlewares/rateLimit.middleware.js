const rateLimit = require("express-rate-limit");

// Strict limiter for auth-sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // allow 10 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    const now = Date.now();
    const resetTime =
      req.rateLimit.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime()
        : now + req.rateLimit.windowMs;

    const retrySecs = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return res.status(429).json({
      code: 429,
      message: `Too many attempts. Try again in ${retrySecs} seconds.`,
      retryAfterSeconds: retrySecs,
    });
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    const now = Date.now();
    const resetTime =
      req.rateLimit.resetTime instanceof Date
        ? req.rateLimit.resetTime.getTime()
        : now + req.rateLimit.windowMs;

    const retrySecs = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return res.status(429).json({
      code: 429,
      message: `Too many requests. Try again in ${retrySecs} seconds.`,
      retryAfterSeconds: retrySecs,
    });
  },
});

module.exports = { authLimiter, generalLimiter };
