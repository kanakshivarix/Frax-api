const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");
const AdminShareService = require("../../services/admin/adminShare.service");

class AdminShareController {
  static list = asyncHandler(async (req, res) => {
    const result = await AdminShareService.listShares({
      userId: req.query.userId,
      evId: req.query.evId,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    return res.sendRes(200, result);
  });
}

module.exports = AdminShareController;
