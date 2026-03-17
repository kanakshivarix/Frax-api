const CafeOutletService = require("../services/cafeOutlet.service");
const { asyncHandler } = require("../utils/helpers/asyncHandler.util");

class CafeOutletController {
  static list = asyncHandler(async (req, res) => {
    const cafes = await CafeOutletService.listCafes(req.query);
    return res.sendRes(200, cafes);
  });

  static getBySlug = asyncHandler(async (req, res) => {
    const cafe = await CafeOutletService.getCafeBySlug(req.params.slug);
    return res.sendRes(200, cafe);
  });
}

module.exports = CafeOutletController;
