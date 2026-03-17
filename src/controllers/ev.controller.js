const { EVService } = require("../services/ev.service");
const ApiResponse = require("../utils/helpers/ApiResponse.util");
const { asyncHandler } = require("../utils/helpers/asyncHandler.util");
const { logger } = require("../utils/helpers/logger.util");

class EVController {
  static createEV = asyncHandler(async (req, res) => {
    const { model, totalPrice, totalShares, expectedMonthlyIncome } = req.body;
    const files = req.files;
    logger.info(`Create EV request for model: ${model}`);
    const result = await EVService.createEV({
      model,
      totalPrice,
      totalShares,
      expectedMonthlyIncome,
      files,
    });
    logger.info(`EV created: ${result.evId}`);
    res.status(201).json(new ApiResponse(201, result, result.message));
  });

  static updateEV = asyncHandler(async (req, res) => {
    const { evId: id } = req.params;
    const { model, totalPrice, totalShares, expectedMonthlyIncome } = req.body;
    logger.info(`Update EV request for ID: ${id}`);
    const message = await EVService.updateEV(id, {
      model,
      totalPrice,
      totalShares,
      expectedMonthlyIncome,
    });
    logger.info(`EV updated: ${id}`);
    res.status(200).json(new ApiResponse(200, {}, message));
  });

  static deleteEV = asyncHandler(async (req, res) => {
    const { evId: id } = req.params;
    logger.info(`Delete EV request for ID: ${id}`);
    const message = await EVService.deleteEV(id);
    logger.info(`EV deleted: ${id}`);
    res.status(200).json(new ApiResponse(200, {}, message));
  });

  static listEVs = asyncHandler(async (req, res) => {
    logger.info("List EVs request");

    const { page, limit, search, sort, sortOrder, hasShares } = req.query;

    const result = await EVService.listEVs({ page, limit, search, sort, sortOrder, hasShares });

    logger.info(`Listed ${result.evs.length} EVs of ${result.total} total`);
    res.status(200).json(new ApiResponse(200, result, "EVs fetched successfully"));
  });
}

module.exports = EVController;
