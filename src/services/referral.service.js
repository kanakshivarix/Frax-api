const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");
const { BASE_URL, constants } = require("../utils/constants/history.constant");
const { ReferralEarning } = require("../models/referralEarning.model");
const { User } = require("../models/user.model");
const moment = require("moment-timezone");
const { default: Decimal } = require("decimal.js");
const { IncomeDistribution } = require("../models/incomeDistribution.model");

class ReferralService {
  static async getReferralLink(userId) {
    logger.info(`Generating referral link for userId: ${userId}`);
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found for userId: ${userId}`);
      throw new ApiError(404, "User not found");
    }
    const referralLink = `${BASE_URL}/login?ref=${user.referralCode}`;
    logger.info(`Referral link generated for userId: ${userId}`);
    return referralLink;
  }

  //for every time user buy share
  static async createDirectReferralBonus({ userId, shares, sharePrice, outletId }) {
    logger.info(`Creating direct referral bonus for userId: ${userId}`);
    const user = await User.findById(userId);
    if (!user || !user.referredBy) {
      logger.info(`No referrer for userId: ${userId}`);
      return;
    }

    const referrer = await User.findById(user.referredBy);
    if (!referrer) {
      logger.error(`Referrer not found for userId: ${user.referredBy}`);
      return;
    }

    const bonusAmount = new Decimal(shares)
      .times(sharePrice)
      .times(0.05)
      .toFixed(2, Decimal.ROUND_HALF_UP);

    const currentPeriod = new Date().toISOString().slice(0, 7);

    const earning = new ReferralEarning({
      userId: referrer._id,
      outletId,
      referredUserId: userId,
      type: constants.Earning_Type.DIRECT_BONUS,
      totalAmount: Number(bonusAmount),
      payoutSchedule: constants.Payout_Schedule.DAILY, // Default, admin can change
      period: currentPeriod,
    });
    await earning.save();

    logger.info(`Direct referral bonus of ₹${bonusAmount} created for referrer: ${referrer._id}`);
  }



  static async getUserIncome(userId, period) {
    logger.info(`Fetching income for user ${userId}, period ${period}`);

    if (!period) {
      period = new Date().toISOString().slice(0, 7);
    } else if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new ApiError(400, "Invalid period format (YYYY-MM)");
    }

    // Fetch co-owner distributions
    const coOwnerDistributions = await IncomeDistribution.find({ userId, period })
      .populate("evId", "model")
      .lean();

    // Fetch referral earnings and populate referred user details
    const referralEarnings = await ReferralEarning.find({ userId, period })
      .populate("outletId", "outletName outletCode")
      .populate("referredUserId", "fullname")
      .lean();

    // Calculate total co-owner income
    const totalCoOwnerIncome = coOwnerDistributions.reduce((sum, dist) => sum + dist.amount, 0);

    // Split referral earnings by type
    const directBonusEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.DIRECT_BONUS,
    );
    const lifetimeEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.LIFETIME_PROFIT_SHARE,
    );
    const binaryBonusEarnings = referralEarnings.filter(
      (earn) =>
        earn.type === constants.Earning_Type.TREE_REFERRAL ||
        earn.type === constants.Earning_Type.BINARY_MATCHING_BONUS,
    );

    // Calculate totals for each referral type
    const directBonusIncome = directBonusEarnings.reduce((sum, earn) => sum + earn.totalAmount, 0);
    const lifetimeIncome = lifetimeEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );
    const binaryBonusIncome = binaryBonusEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );

    // Total referral income
    const totalReferralIncome = directBonusIncome + lifetimeIncome + binaryBonusIncome;

    // Total income
    const totalIncome = totalCoOwnerIncome + totalReferralIncome;

    return {
      userId,
      period,
      totalIncome,
      totalCoOwnerIncome,
      totalReferralIncome,
      referralIncomeBreakdown: {
        directBonusIncome,
        lifetimeIncome,
        binaryBonusIncome,
      },
      coOwnerDistributions: coOwnerDistributions.map((dist) => ({
        evId: dist.evId._id,
        model: dist.evId.model,
        amount: dist.amount,
        period: dist.period,
        createdAt: dist.createdAt,
      })),
      referralEarnings: referralEarnings.map((earn) => ({
        outletId: earn.outletId ? earn.outletId._id : null,
        outletName: earn.outletId ? earn.outletId.outletName : null,
        amount: earn.totalAmount,
        type: earn.type,
        referredUserId: earn.referredUserId ? earn.referredUserId._id : null,
        referredUserName: earn.referredUserId ? earn.referredUserId.fullname : null,
        period: earn.period,
        createdAt: earn.createdAt,
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    };
  }

  static async getUserTotalIncomeTillToday(userId) {
    logger.info(`Fetching total income for user ${userId} till today`);

    // Define the cutoff date (end of today in IST)
    const today = moment().tz("Asia/Kolkata").endOf("day").toDate(); // e.g., May 16, 2025, 23:59:59.999 IST

    // Fetch co-owner distributions up to today
    const coOwnerDistributions = await IncomeDistribution.find({
      userId,
      createdAt: { $lte: today },
    })
      .populate("evId", "model")
      .lean();

    // Fetch referral earnings up to today and populate referred user details
    const referralEarnings = await ReferralEarning.find({
      userId,
      createdAt: { $lte: today },
    })
      .populate("outletId", "outletName outletCode")
      .populate("referredUserId", "fullname")
      .lean();

    // Calculate total co-owner income
    const totalCoOwnerIncome = coOwnerDistributions.reduce((sum, dist) => sum + dist.amount, 0);

    // Split referral earnings by type
    const directBonusEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.DIRECT_BONUS,
    );
    const lifetimeEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.LIFETIME_PROFIT_SHARE,
    );
    const binaryBonusEarnings = referralEarnings.filter(
      (earn) =>
        earn.type === constants.Earning_Type.TREE_REFERRAL ||
        earn.type === constants.Earning_Type.BINARY_MATCHING_BONUS,
    );

    // Calculate totals for each referral type
    const directBonusIncome = directBonusEarnings.reduce((sum, earn) => sum + earn.totalAmount, 0);
    const lifetimeIncome = lifetimeEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );
    const binaryBonusIncome = binaryBonusEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );

    // Total referral income
    const totalReferralIncome = directBonusIncome + lifetimeIncome + binaryBonusIncome;

    // Total income
    const totalIncome = totalCoOwnerIncome + totalReferralIncome;

    return {
      userId,
      totalIncome,
      totalCoOwnerIncome,
      totalReferralIncome,
      referralIncomeBreakdown: {
        directBonusIncome,
        lifetimeIncome,
        binaryBonusIncome,
      },
      coOwnerDistributions: coOwnerDistributions.map((dist) => ({
        evId: dist.evId._id,
        model: dist.evId.model,
        amount: dist.amount,
        period: dist.period,
        createdAt: dist.createdAt,
      })),
      referralEarnings: referralEarnings.map((earn) => ({
        outletId: earn.outletId ? earn.outletId._id : null,
        outletName: earn.outletId ? earn.outletId.outletName : null,
        amount: earn.totalAmount,
        type: earn.type,
        referredUserId: earn.referredUserId ? earn.referredUserId._id : null,
        referredUserName: earn.referredUserId ? earn.referredUserId.fullname : null,
        period: earn.period,
        createdAt: earn.createdAt,
      })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    };
  }

  static async getReferralHistory(userId)
  {
    logger.info(`Fetching referral history for userId :${userId}`);
    const referredUsers=await User.find({referredBy:userId})
    .select("firstName lastName email phone createdAt")
    .lean();
    return referredUsers.map((user)=>({
      userId:user._id,
      name:`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.phone,
      email:user.email,
      phone:user.phone,
      joinedAt:user.createdAt,
    }))
  }
  static async createBinaryIncome(userId, outletId, amount) {
    const buyer = await User.findById(userId).select("parentId position");
    if (!buyer || !buyer.parentId || !buyer.position) return;

    const purchaseAmount = new Decimal(amount || 0);
    if (purchaseAmount.lte(0)) return;

    let currentUser = buyer;

    // Propagate volume up the binary lineage and pay 5% on newly matched volume.
    while (currentUser.parentId) {
      const parent = await User.findById(currentUser.parentId);
      if (!parent) break;

      if (currentUser.position === "left") {
        parent.leftTeamVolume = new Decimal(parent.leftTeamVolume || 0)
          .plus(purchaseAmount)
          .toNumber();
      } else if (currentUser.position === "right") {
        parent.rightTeamVolume = new Decimal(parent.rightTeamVolume || 0)
          .plus(purchaseAmount)
          .toNumber();
      }

      const matchedVolume = Decimal.min(
        new Decimal(parent.leftTeamVolume || 0),
        new Decimal(parent.rightTeamVolume || 0)
      );
      const alreadyPaidMatched = new Decimal(parent.matchedVolumePaid || 0);
      const newlyMatchedVolume = matchedVolume.minus(alreadyPaidMatched);

      if (newlyMatchedVolume.gt(0)) {
        const bonus = newlyMatchedVolume.times(0.05).toFixed(2, Decimal.ROUND_HALF_UP);
        parent.matchedVolumePaid = alreadyPaidMatched
          .plus(newlyMatchedVolume)
          .toNumber();

        await ReferralEarning.create({
          userId: parent._id,
          referredUserId: userId,
          outletId,
          type: constants.Earning_Type.BINARY_MATCHING_BONUS,
          totalAmount: Number(bonus),
          period: new Date().toISOString().slice(0, 7),
        });
      }

      await parent.save();
      currentUser = parent;
    }
  }
  static async createLifetimeIncome(userId, outletId, profit, period) {
    const user = await User.findById(userId);
    if (!user || !user.referredBy) return;

    const referrer = await User.findById(user.referredBy);
    if (!referrer) return;

    const bonus = profit * 0.05;

    await ReferralEarning.create({
      userId: referrer._id,
      referredUserId: userId,
      outletId,
      type: constants.Earning_Type.LIFETIME_PROFIT_SHARE,
      totalAmount: bonus,
      period: period || new Date().toISOString().slice(0, 7),
    });
  }

}

module.exports = { ReferralService };
