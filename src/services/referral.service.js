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
  static async createDirectReferralBonus({ userId, shares, sharePrice, evId }) {
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
      evId,
      referredUserId: userId,
      type: constants.Earning_Type.DIRECT_BONUS,
      totalAmount: Number(bonusAmount),
      payoutSchedule: constants.Payout_Schedule.DAILY, // Default, admin can change
      period: currentPeriod,
    });
    await earning.save();

    logger.info(`Direct referral bonus of ₹${bonusAmount} created for referrer: ${referrer._id}`);
  }

  static async updatePayoutSchedule(earningId, payoutSchedule) {
    logger.info(`Updating payout schedule for earningId: ${earningId}`);
    if (!["daily", "weekly", "monthly"].includes(payoutSchedule)) {
      logger.error(`Invalid payout schedule: ${payoutSchedule}`);
      throw new ApiError(400, "Invalid payout schedule");
    }
    const earning = await ReferralEarning.findById(earningId);
    if (!earning) {
      logger.error(`Earning not found for earningId: ${earningId}`);
      throw new ApiError(404, "Earning not found");
    }
    earning.payoutSchedule = payoutSchedule;
    await earning.save();
    logger.info(`Payout schedule updated to ${payoutSchedule} for earningId: ${earningId}`);
    return "Payout schedule updated";
  }

  static async getUserIncome(userId, period) {
    logger.info(`Fetching income for user ${userId}, period ${period}`);

    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new ApiError(400, "Invalid period format (YYYY-MM)");
    }

    // Fetch co-owner distributions
    const coOwnerDistributions = await IncomeDistribution.find({ userId, period })
      .populate("evId", "model")
      .lean();

    // Fetch referral earnings and populate referred user details
    const referralEarnings = await ReferralEarning.find({ userId, period })
      .populate("evId", "model")
      .populate("referredUserId", "fullname")
      .lean();

    // Calculate total co-owner income
    const totalCoOwnerIncome = coOwnerDistributions.reduce((sum, dist) => sum + dist.amount, 0);

    // Split referral earnings by type
    const directBonusEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.DIRECT_BONUS,
    );
    const evIncomeShareEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.EV_INCOME_SHARE,
    );
    const treeReferralEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.TREE_REFERRAL,
    );

    // Calculate totals for each referral type
    const directBonusIncome = directBonusEarnings.reduce((sum, earn) => sum + earn.totalAmount, 0);
    const evIncomeShareIncome = evIncomeShareEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );
    const treeReferralIncome = treeReferralEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );

    // Total referral income
    const totalReferralIncome = directBonusIncome + evIncomeShareIncome + treeReferralIncome;

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
        evIncomeShareIncome,
        treeReferralIncome,
      },
      coOwnerDistributions: coOwnerDistributions.map((dist) => ({
        evId: dist.evId._id,
        model: dist.evId.model,
        amount: dist.amount,
        period: dist.period,
        createdAt: dist.createdAt,
      })),
      referralEarnings: {
        directBonus: directBonusEarnings.map((earn) => ({
          evId: earn.evId ? earn.evId._id : null,
          model: earn.evId ? earn.evId.model : null,
          amount: earn.totalAmount,
          type: earn.type,
          referredUserId: earn.referredUserId._id,
          referredUserName: earn.referredUserId.fullname,
          period: earn.period,
          createdAt: earn.createdAt,
        })),
        evIncomeShare: evIncomeShareEarnings.map((earn) => ({
          evId: earn.evId ? earn.evId._id : null,
          model: earn.evId ? earn.evId.model : null,
          amount: earn.totalAmount,
          type: earn.type,
          referredUserId: earn.referredUserId._id,
          referredUserName: earn.referredUserId.fullname,
          period: earn.period,
          createdAt: earn.createdAt,
        })),
        treeReferral: treeReferralEarnings.map((earn) => ({
          evId: earn.evId ? earn.evId._id : null,
          model: earn.evId ? earn.evId.model : null,
          amount: earn.totalAmount,
          type: earn.type,
          referredUserId: earn.referredUserId._id,
          referredUserName: earn.referredUserId.fullname,
          period: earn.period,
          createdAt: earn.createdAt,
        })),
      },
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
      .populate("evId", "model")
      .populate("referredUserId", "fullname")
      .lean();

    // Calculate total co-owner income
    const totalCoOwnerIncome = coOwnerDistributions.reduce((sum, dist) => sum + dist.amount, 0);

    // Split referral earnings by type
    const directBonusEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.DIRECT_BONUS,
    );
    const evIncomeShareEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.EV_INCOME_SHARE,
    );
    const treeReferralEarnings = referralEarnings.filter(
      (earn) => earn.type === constants.Earning_Type.TREE_REFERRAL,
    );

    // Calculate totals for each referral type
    const directBonusIncome = directBonusEarnings.reduce((sum, earn) => sum + earn.totalAmount, 0);
    const evIncomeShareIncome = evIncomeShareEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );
    const treeReferralIncome = treeReferralEarnings.reduce(
      (sum, earn) => sum + earn.totalAmount,
      0,
    );

    // Total referral income
    const totalReferralIncome = directBonusIncome + evIncomeShareIncome + treeReferralIncome;

    // Total income
    const totalIncome = totalCoOwnerIncome + totalReferralIncome;

    return {
      userId,
      totalIncome,
      totalCoOwnerIncome,
      totalReferralIncome,
      referralIncomeBreakdown: {
        directBonusIncome,
        evIncomeShareIncome,
        treeReferralIncome,
      },
      coOwnerDistributions: coOwnerDistributions.map((dist) => ({
        evId: dist.evId._id,
        model: dist.evId.model,
        amount: dist.amount,
        period: dist.period,
        createdAt: dist.createdAt,
      })),
      referralEarnings: {
        directBonus: directBonusEarnings.map((earn) => ({
          evId: earn.evId ? earn.evId._id : null,
          model: earn.evId ? earn.evId.model : null,
          amount: earn.totalAmount,
          type: earn.type,
          referredUserId: earn.referredUserId._id,
          referredUserName: earn.referredUserId.fullname,
          period: earn.period,
          createdAt: earn.createdAt,
        })),
        evIncomeShare: evIncomeShareEarnings.map((earn) => ({
          evId: earn.evId ? earn.evId._id : null,
          model: earn.evId ? earn.evId.model : null,
          amount: earn.totalAmount,
          type: earn.type,
          referredUserId: earn.referredUserId._id,
          referredUserName: earn.referredUserId.fullname,
          period: earn.period,
          createdAt: earn.createdAt,
        })),
        treeReferral: treeReferralEarnings.map((earn) => ({
          evId: earn.evId ? earn.evId._id : null,
          model: earn.evId ? earn.evId.model : null,
          amount: earn.totalAmount,
          type: earn.type,
          referredUserId: earn.referredUserId._id,
          referredUserName: earn.referredUserId.fullname,
          period: earn.period,
          createdAt: earn.createdAt,
        })),
      },
    };
  }

  static async getReferralHistory(userId)
  {
    logger.info(`Fetching referral history for userId :${userId}`);
    const referredUsers=await User.find({referredBy:userId})
    .select("firstName lastName email createdAt")
    .lean();
    return referredUsers.map((user)=>({
      userId:user._id,
      name:`${user.firstName || ""} ${user.lastName || ""}`,
      email:user.email,
      joinedAt:user.createdAt,
    }))
  }
  static async createBinaryIncome(userId, evId, amount) {
  const user = await User.findById(userId);
  if (!user.parentId) return;

  const parent = await User.findById(user.parentId);
  if (!parent) return;

  const leftCount = await User.countDocuments({
    parentId: parent._id,
    position: "left",
  });

  const rightCount = await User.countDocuments({
    parentId: parent._id,
    position: "right",
  });

 const matchedPairs = Math.min(leftCount, rightCount);

const newPairs = matchedPairs - (parent.binaryPairsPaid || 0);

if (newPairs <= 0) return;

const bonus = newPairs * amount * 0.05;

parent.binaryPairsPaid = (parent.binaryPairsPaid || 0) + newPairs;
await parent.save();

  await ReferralEarning.create({
    userId: parent._id,
    referredUserId: userId,
    evId,
    type: constants.Earning_Type.TREE_REFERRAL,
    totalAmount: bonus,
    period: new Date().toISOString().slice(0, 7),
  });
}
static async createLifetimeIncome(userId, evId, profit) {
  const user = await User.findById(userId);
  if (!user.referredBy) return;

  const referrer = await User.findById(user.referredBy);
  if (!referrer) return;

  const bonus = profit * 0.05;

  await ReferralEarning.create({
    userId: referrer._id,
    referredUserId: userId,
    evId,
    type: constants.Earning_Type.EV_INCOME_SHARE,
    totalAmount: bonus,
    period: new Date().toISOString().slice(0, 7),
  });
}

}

module.exports = { ReferralService };
