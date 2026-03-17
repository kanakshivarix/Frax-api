const CafeOutletService = require("../../services/cafeOutlet.service");
const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");

class AdminCafeOutletController {
  static create = asyncHandler(async (req, res) => {
    const cafe = await CafeOutletService.createCafe({
      adminId: req.user.userId,
      payload: req.body,
    });

    return res.sendRes(201, cafe, "Cafe outlet created");
  });

  static list = asyncHandler(async (req, res) => {
    const result = await CafeOutletService.listAdminCafes(req.query);
    return res.sendRes(200, result, "Admin cafes fetched");
  });
}

module.exports = AdminCafeOutletController;
