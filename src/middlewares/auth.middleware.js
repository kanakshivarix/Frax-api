const { logger } = require("../utils/helpers/logger.util");
const ApiError = require("../errors/ApiErrors");
const { verifyAccessToken } = require("../utils/token.util");
const userRepo = require("../repositories/user.repository");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Unauthorized: Token missing");
      throw new ApiError(401, "Unauthorized");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      logger.warn("Unauthorized access attempt: Token extraction failed");
      throw new ApiError(401, "Unauthorized: Token missing");
    }

    const decoded = verifyAccessToken(token);

    const user = await userRepo.findById(decoded.userId);

    if (!user) {
      logger.error(`User not found for userId: ${decoded.userId}`);
      throw new ApiError(401, "Unauthorized: User not found");
    }

    if (user.isDisabled) {
      logger.warn(`User account disabled for userId: ${decoded.userId}`);
      throw new ApiError(403, "Forbidden: User account is disabled");
    }

    req.user = Object.freeze({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    next();
  } catch (error) {
    if (!(error instanceof ApiError)) {
      logger.error("Auth middleware failed", { error: error.message });
      return next(new ApiError(401, "Authentication failed"));
    }
    return next(error);
  }
};

module.exports = { authMiddleware };
