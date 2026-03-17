const { JWT_SECRET, REFRESH_SECRET } = require("./env.config");

const jwtConfig = {
  accessSecret: JWT_SECRET,
  refreshSecret: REFRESH_SECRET,
  accessExpiresIn: 24 * 60 * 60, // 1 day in seconds
  refreshExpiresIn: 2 * 24 * 60 * 60, // 2 days in seconds
};

module.exports = jwtConfig;
