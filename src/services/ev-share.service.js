const { EV } = require("../models/ev.model");
const { Share } = require("../models/share.model");
const { ReferralService } = require("./referral.service");
const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");
const { default: Decimal } = require("decimal.js");
const KycService = require("./admin/kyc.service");
const { constants } = require("../utils/constants/history.constant");

Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

class EVShareService {
  static async buyShares(userId, evId, shares) {
    logger.info(`Buy shares attempt for userId: ${userId}, evId: ${evId}`);

    const kyc = await KycService.getKyc(userId);
    if (kyc.status !== constants.KYC_STATUS.VERIFIED) {
      logger.error(`KYC not verified for user ${userId}`);
      throw new ApiError(403, "KYC verification required");
    }

    const ev = await EV.findOne({ _id: evId, isDeleted: false });
    if (!ev) {
      logger.error(`EV not found for evId: ${evId}`);
      throw new ApiError(404, "EV not found");
    }

    const availableShares = ev.totalShares - ev.bookedShares;
    if (shares > availableShares) {
      logger.error(
        `Insufficient shares available for evId: ${evId}, requested: ${shares}, available: ${availableShares}`
      );
      throw new ApiError(400, `Only ${availableShares} shares available`);
    }

    const existingShare = await Share.findOne({ userId, evId });
    if (existingShare) {
      existingShare.sharesPurchased += shares;
      await existingShare.save();
    } else {
      const share = new Share({
        userId,
        evId,
        sharesPurchased: shares,
        sharePrice: ev.pricePerShare,
      });
      await share.save();
    }

    ev.bookedShares += shares;
    await ev.save();

    // Trigger direct referral bonus every time user buys it will
    await ReferralService.createDirectReferralBonus({
      userId,
      shares,
      sharePrice: ev.pricePerShare,
      evId,
    });
    await ReferralService.createBinaryIncome(
  userId,
  evId,
  shares * ev.pricePerShare
);
const monthlyProfit = ev.expectedMonthlyIncome;

await ReferralService.createLifetimeIncome(
  userId,
  evId,
  monthlyProfit
);

    logger.info(`Shares purchased for userId: ${userId}, evId: ${evId}`);
    return "Shares purchased";
  }

  static async getOwnershipStatus(userId) {
    logger.info(`Fetching ownership status for user ${userId}`);

    // Fetch user's shares
    const shares = await Share.find({ userId })
      .populate({
        path: "evId",
        select: "model totalShares bookedShares pricePerShare expectedMonthlyIncome isDeleted",
        match: { isDeleted: false },
      })
      .lean();

    const ownership = await Promise.all(
      shares
        .filter((share) => share.evId) // Exclude deleted EVs
        .map(async (share) => {
          const ev = share.evId;
          const totalUserShares = share.sharesPurchased;
          const ownershipStatus = totalUserShares === ev.totalShares ? "SOLE_OWNER" : "CO_OWNER";
          const ownershipPercentage = (totalUserShares / ev.totalShares) * 100;
          const totalValue = new Decimal(share.sharePrice).times(totalUserShares);

          // Get co-owners count
          const coOwnersCount = await Share.countDocuments({
            evId: ev._id,
            userId: { $ne: userId },
          });

          return {
            evId: ev._id,
            model: ev.model,
            totalUserShares,
            totalShares: ev.totalShares,
            ownershipStatus,
            totalValue,
            ownershipPercentage: Number(ownershipPercentage.toFixed(2)),
            pricePerShare: ev.pricePerShare,
            priceAtPurchase: share.sharePrice,
            expectedMonthlyIncome: ev.expectedMonthlyIncome,
            purchaseDate: share.createdAt,
            coOwnersCount: ownershipStatus === "CO_OWNER" ? coOwnersCount + 1 : 1,
          };
        })
    );

    logger.info(`Found ${ownership.length} EVs for user ${userId}`);
    return ownership;
  }

}

module.exports = { EVShareService };
