const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://subcheliform-tentier-lanie.ngrok-free.dev",
  "https://commercially-untrumping-kathrin.ngrok-free.dev",
  "https://commercially-untrumping-kathrin.ngrok-free.dev",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  
 
];

exports.corsOptions = {
  origin: (origin, callback) => {
     console.log("CORS Origin:", origin);
    // Allow server-to-server requests (webhooks, cron, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow known frontends
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log ONLY when something is blocked
    // logger.warn(`[CORS] Blocked request from origin: ${origin}`);
    return callback(new Error("This origin is not allowed by CORS"));
  },

  credentials: true,
};
