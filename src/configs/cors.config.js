<<<<<<< HEAD
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://subcheliform-tentier-lanie.ngrok-free.dev",
  "https://commercially-untrumping-kathrin.ngrok-free.dev",
  "https://commercially-untrumping-kathrin.ngrok-free.dev",
  "https://commercially-untrumping-kathrin.ngrok-free.dev",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  

];
=======
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:5174", "http://localhost:5173/" ,"https://cafewafe.com/" , "https://admin.cafewafe.com/"];
>>>>>>> f6303c56691410e5f700b20796d5aa9beae89b69

exports.corsOptions = {
  origin: (origin, callback) => {
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
