const { logger } = require("../utils/helpers/logger.util");
const { asyncHandler } = require("../utils/helpers/asyncHandler.util");
const ApiResponse = require("../utils/helpers/ApiResponse.util");
const { EVShareService } = require("../services/ev-share.service");

class ShareController {
  static buyShares = asyncHandler(async (req, res) => {
    const { evId, shares } = req.body;
    const { _id: userId } = req.user;
    logger.info(`Buy shares request for userId: ${userId}, evId: ${evId}`);
    const message = await EVShareService.buyShares(userId, evId, shares);
    logger.info(`Shares purchased for userId: ${userId}, evId: ${evId}`);
    res.status(200).json(new ApiResponse(200, message));
  });

  static getOwnershipStatus = async (req, res) => {
    const { _id: userId } = req.user;
    logger.info(`Getting ownership status for user ${userId}`);

    const ownership = await EVShareService.getOwnershipStatus(userId);
    res.json(new ApiResponse(200, ownership, "Ownership status fetched successfully"));
  };
}

module.exports = ShareController;
