const jwt = require("jsonwebtoken");
const jwtConfig = require("../configs/jwt.config");
const { logger } = require("./helpers/logger.util");

/**
 * ACCESS TOKEN
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    jwtConfig.accessSecret,
    {
      expiresIn: jwtConfig.accessExpiresIn,
    },
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.accessSecret);
  } catch (error) {
    logger.warn("Access token verification failed", { error: error.message });
    throw error;
  }
};

/**
 * REFRESH TOKEN
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
    },
    jwtConfig.refreshSecret,
    {
      expiresIn: jwtConfig.refreshExpiresIn,
    },
  );
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret);
  } catch (error) {
    logger.warn("Refresh token verification failed", { error: error.message });
    throw error;
  }
};

const generateJWTToken = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  logger.debug("JWT issued", { userId: user._id.toString() });
  return { accessToken, refreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateJWTToken,
};
