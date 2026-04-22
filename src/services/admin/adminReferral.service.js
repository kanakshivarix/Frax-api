const { ReferralEarning } = require("../../models/referralEarning.model");
const { constants } = require("../../utils/constants/history.constant");
const ApiError = require("../../errors/ApiErrors");

class AdminReferralService {
  static async getOverview({ period }) {
    const filter = {};
    if (period) filter.period = period;

    const earnings = await ReferralEarning.find(filter).lean();

    const totalEarnings = earnings.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const directBonus = earnings
      .filter((item) => item.type === constants.Earning_Type.DIRECT_BONUS)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const lifetimeProfitShare = earnings
      .filter((item) => item.type === constants.Earning_Type.EV_INCOME_SHARE)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const binaryMatchingBonus = earnings
      .filter((item) => item.type === constants.Earning_Type.BINARY_MATCHING_BONUS)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    return {
      period: period || "all",
      totalEntries: earnings.length,
      totalEarnings,
      breakdown: {
        directBonus,
        lifetimeProfitShare,
        binaryMatchingBonus,
      },
    };
  }

  static async listEarnings({ period, type, page, limit }) {
    const filter = {};
    if (period) filter.period = period;
    if (type) filter.type = type;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      ReferralEarning.find(filter)
        .populate("userId", "firstName lastName email phone")
        .populate("referredUserId", "firstName lastName email phone")
        .populate("evId", "model")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      ReferralEarning.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  static async updatePayoutSchedule(earningId, payoutSchedule) {
    if (!["daily", "weekly", "monthly"].includes(payoutSchedule)) {
      throw new ApiError(400, "Invalid payout schedule");
    }
    const earning = await ReferralEarning.findById(earningId);
    if (!earning) {
      throw new ApiError(404, "Earning not found");
    }
    earning.payoutSchedule = payoutSchedule;
    await earning.save();
    return "Payout schedule updated";
  }
}

module.exports = AdminReferralService;
