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
  static changeStatus = asyncHandler(async (req, res) => {
    const { cafeId } = req.params;
    const { status } = req.body;

    const updatedCafe = await CafeOutletService.updateCafeStatus(
      cafeId,
      status,
    );

    return res.sendRes(200, updatedCafe, "Cafe status updated successfully");
  });
  static update = asyncHandler(async (req, res) => {
    const { cafeId } = req.params;

    const updated = await CafeOutletService.updateCafe({
      cafeId,
      updateData: req.body,
    });

    return res.sendRes(200, updated, "Cafe updated successfully");
  });

  static getById = asyncHandler(async (req, res) => {
    const { cafeId } = req.params;

    const cafe = await CafeOutletService.getById(cafeId);

    if (!cafe) {
      return res.sendRes(404, null, "Cafe not found");
    }

    return res.sendRes(200, cafe, "Cafe fetched successfully");
  });

  static delete = asyncHandler(async (req, res) => {
    const { cafeId } = req.params;

    await CafeOutletService.deleteCafe(cafeId);

    return res.sendRes(200, null, "Cafe and associated files deleted successfully");
  });
}

module.exports = AdminCafeOutletController;
