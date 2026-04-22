const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");
const AdminReferralService = require("../../services/admin/adminReferral.service");

class AdminReferralController {
  static overview = asyncHandler(async (req, res) => {
    const result = await AdminReferralService.getOverview({
      period: req.query.period,
    });
    return res.sendRes(200, result);
  });

  static list = asyncHandler(async (req, res) => {
    const result = await AdminReferralService.listEarnings({
      period: req.query.period,
      type: req.query.type,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    return res.sendRes(200, result);
  });

  static updatePayoutSchedule = asyncHandler(async (req, res) => {
    const { earningId, payoutSchedule } = req.body;
    const message = await AdminReferralService.updatePayoutSchedule(earningId, payoutSchedule);
    return res.sendRes(200, {}, message);
  });
}

module.exports = AdminReferralController;
