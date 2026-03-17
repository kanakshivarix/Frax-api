const { connect } = require("mongoose");
const { MONGO_URI, DB_NAME } = require("./env.config");
const { logger } = require("../utils/helpers/logger.util");

async function connectToMongoDB() {
  try {
    await connect(MONGO_URI, { dbName: DB_NAME });
    logger.info("Connected to MongoDB successfully!");
  } catch (error) {
    if (error instanceof Error) {
      logger.error("Error connecting to MongoDB", { message: error.message });
    } else {
      logger.error("An unknown error occurred while connecting to MongoDB", { error });
    }
    process.exit(1);
  }
}

module.exports = { connectToMongoDB };
