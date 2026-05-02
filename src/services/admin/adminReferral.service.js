const { ReferralEarning } = require("../../models/referralEarning.model");
const { constants } = require("../../utils/constants/history.constant");
const ApiError = require("../../errors/ApiErrors");
const Investment = require("../../models/investment.model");
const Property = require("../../models/property.model");
const { ReferralService } = require("../referral.service");

class AdminReferralService {
  static async getOverview({ period }) {
    const filter = {};
    if (period) filter.period = period;

    const earnings = await ReferralEarning.find(filter).lean();

    const totalEarnings = earnings.reduce(
      (sum, item) => sum + (item.totalAmount || 0),
      0,
    );
    const directBonus = earnings
      .filter((item) => item.type === constants.Earning_Type.DIRECT_BONUS)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    // const lifetimeProfitShare = earnings
    //   .filter(
    //     (item) => item.type === constants.Earning_Type.LIFETIME_PROFIT_SHARE,
    //   )
    //   .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    // const binaryMatchingBonus = earnings
    //   .filter(
    //     (item) => item.type === constants.Earning_Type.BINARY_MATCHING_BONUS,
    //   )
    //   .reduce((sum, item) => sum + (item.totalAmount || 0), 0);

    return {
      period: period || "all",
      totalEntries: earnings.length,
      totalEarnings,
      breakdown: {
        directBonus,
        // lifetimeProfitShare,
        // binaryMatchingBonus,
      },
    };
  }

  static async listEarnings({ period, type, page, limit,search }) {
    const filter = {};
    if (period) filter.period = period;
    if (type) filter.type = type;
    if(search)
    {
      filter.$or=[
        {"userId.firstName":{$regex:search,$options:"i"}},
        {"userId.lastName":{$regex:search,$options:"i"}},
        {"referredUserId.firstName":{$regex:search,$options:"i"}},
        {"referredUserId.lastName":{$regex:search,$options:"i"}},
      ]
    }

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      ReferralEarning.find(filter)
        .populate("userId", "firstName lastName email phone")
        .populate("referredUserId", "firstName lastName email phone")
        .populate("propertyId", "title city")
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

  /*
  static async distributeProfit(propertyId, profit, period) {
    const property = await Property.findById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const investments = await Investment.find({
      propertyId,
      status: "ADMIN_APPROVED",
    });
    if (!investments.length) return "No investments found for this property";

    const totalShares = outlet.totalShares;

    // Group shares by user
    const userShares = {};
    for (const inv of investments) {
      userShares[inv.userId] = (userShares[inv.userId] || 0) + inv.shares;
    }

    let bonusesCreated = 0;
    for (const userId of Object.keys(userShares)) {
      const shares = userShares[userId];
      const shareFraction = shares / totalShares;
      const userProfit = profit * shareFraction;

      await ReferralService.createLifetimeIncome(
        userId,
        propertyId,
        userProfit,
        period,
      );
      bonusesCreated++;
    }

    return {
      message: `Generated ${bonusesCreated} lifetime bonuses`,
      property: property.title,
      profitDistributed: profit,
    };
  }
  */
}

module.exports = AdminReferralService;
