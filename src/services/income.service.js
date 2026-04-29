const { EV } = require("../models/ev.model");
const { Share } = require("../models/share.model");
const { IncomeDistribution } = require("../models/incomeDistribution.model");
const { ReferralEarning } = require("../models/referralEarning.model");
const { User } = require("../models/user.model");
const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");
const { default: Decimal } = require("decimal.js");
const { constants } = require("../utils/constants/history.constant");

Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

class IncomeService {
  // Helper to calculate total income for a user in a period
  static async calculateUserTotalIncome(userId, period) {
    const coOwnerDistributions = await IncomeDistribution.find({ userId, period }).lean();
    const referralEarnings = await ReferralEarning.find({ userId, period }).lean();

    const totalCoOwnerIncome = coOwnerDistributions.reduce((sum, dist) => sum + dist.amount, 0);
    const totalReferralIncome = referralEarnings.reduce((sum, earn) => sum + earn.totalAmount, 0);
    return new Decimal(totalCoOwnerIncome).plus(totalReferralIncome).toNumber();
  }

  static async distributeIncome(period) {
    logger.info(`Distributing income for period ${period}`);

    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new ApiError(400, "Invalid period format (YYYY-MM)");
    }

    const [year, month] = period.split("-").map(Number);
    const periodStart = new Date(year, month - 1, 1);

    const evs = await EV.find({ isDeleted: false, monthlyIncome: { $gt: 0 } }).lean();
    if (!evs.length) {
      logger.info("No EVs with income to distribute");
      return { message: "No EVs with income", distributions: [], referralEarnings: [] };
    }

    const distributions = [];
    const referralEarnings = [];

    // Step 1: Distribute co-owner income and direct referral income
    for (const ev of evs) {
      const existingDistributions = await IncomeDistribution.countDocuments({
        evId: ev._id,
        period,
      });
      if (existingDistributions > 0) {
        logger.info(`Income already distributed for EV ${ev._id}, period ${period}`);
        continue;
      }

      const shares = await Share.find({
        evId: ev._id,
        createdAt: { $lt: periodStart },
      }).lean();
      if (!shares.length) {
        logger.info(`No eligible co-owners for EV ${ev._id}`);
        continue;
      }

      const totalShares = ev.totalShares;
      const monthlyIncome = new Decimal(ev.monthlyIncome);

      for (const share of shares) {
        const shareFraction = new Decimal(share.sharesPurchased).div(totalShares);
        const coOwnerIncome = monthlyIncome.times(shareFraction).toFixed(2);

        distributions.push({
          evId: ev._id,
          userId: share.userId,
          amount: Number(coOwnerIncome),
          period,
        });

        // Lifetime bonus commented out as per request
        // const user = await User.findById(share.userId).select("referredBy");
        // if (user && user.referredBy) {
        //   const referrer = await User.findById(user.referredBy);
        //   if (referrer) {
        //     const referralIncome = new Decimal(coOwnerIncome).times(0.05).toFixed(2);
        //     referralEarnings.push({
        //       userId: referrer._id,
        //       referredUserId: share.userId,
        //       evId: ev._id,
        //       type: constants.Earning_Type.LIFETIME_PROFIT_SHARE,
        //       totalAmount: Number(referralIncome),
        //       period,
        //       payoutSchedule: constants.Payout_Schedule.DAILY,
        //     });
        //   }
        // }
      }
    }

    await Promise.all([
      distributions.length ? IncomeDistribution.insertMany(distributions) : Promise.resolve(),
      referralEarnings.length ? ReferralEarning.insertMany(referralEarnings) : Promise.resolve(),
    ]);

    logger.info(
      `Distributed income for period ${period}: ${distributions.length} co-owner distributions, ${referralEarnings.length} referral earnings`
    );
    return {
      message: "Income distributed successfully",
      distributions,
      referralEarnings,
    };
  }

  static async getUserIncome(userId, period) {
    logger.info(`Fetching income for user ${userId}, period ${period}`);

    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new ApiError(400, "Invalid period format (YYYY-MM)");
    }

    const coOwnerDistributions = await IncomeDistribution.find({ userId, period })
      .populate("evId", "model")
      .lean();

    const referralEarnings = await ReferralEarning.find({ userId, period })
      .populate("evId", "model")
      .lean();

    const totalCoOwnerIncome = coOwnerDistributions.reduce((sum, dist) => sum + dist.amount, 0);
    const totalReferralIncome = referralEarnings.reduce((sum, earn) => sum + earn.totalAmount, 0);
    const totalIncome = totalCoOwnerIncome + totalReferralIncome;

    return {
      userId,
      period,
      totalIncome,
      coOwnerDistributions: coOwnerDistributions.map((dist) => ({
        evId: dist.evId._id,
        model: dist.evId.model,
        amount: dist.amount,
        period: dist.period,
        createdAt: dist.createdAt,
      })),
      referralEarnings: referralEarnings.map((earn) => ({
        evId: earn.evId ? earn.evId._id : null,
        model: earn.evId ? earn.evId.model : null,
        amount: earn.totalAmount,
        type: earn.type,
        referredUserId: earn.referredUserId,
        period: earn.period,
        createdAt: earn.createdAt,
      })),
    };
  }
}

module.exports = IncomeService;
