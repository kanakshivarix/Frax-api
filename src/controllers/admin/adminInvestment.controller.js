const AdminInvestmentService = require("../../services/admin/adminInvestment.service");
const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");

class AdminInvestmentController {
  static approve = asyncHandler(async (req, res) => {
    await AdminInvestmentService.approveInvestment({
      investmentId: req.params.investmentId,
      adminId: req.user.userId,
    });

    return res.sendRes(200, null, "Investment approved");
  });

  static reject = asyncHandler(async (req, res) => {
    await AdminInvestmentService.rejectInvestment({
      investmentId: req.params.investmentId,
      reason: req.body.reason,
      adminId: req.user.userId,
    });

    return res.sendRes(200, null, "Investment rejected");
  });

  static list = asyncHandler(async (req, res) => {
    const result = await AdminInvestmentService.listInvestments(req.query);
    return res.sendRes(200, result);
  });

  static getById = asyncHandler(async (req, res) => {
    const investment = await AdminInvestmentService.getInvestmentById(req.params.investmentId);
    return res.sendRes(200, investment);
  });
}

module.exports = AdminInvestmentController;
