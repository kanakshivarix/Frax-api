const { logger } = require("../utils/helpers/logger.util");
const { asyncHandler } = require("../utils/helpers/asyncHandler.util");
const { ReferralService } = require("../services/referral.service");
const ApiResponse = require("../utils/helpers/ApiResponse.util");

class ReferralController {
  /**
   * @User
   */
  static getReferralLink = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    logger.info(`Referral link request for userId: ${userId}`);
    const referralLink = await ReferralService.getReferralLink(userId);
    logger.info(`Referral link generated for userId: ${userId}`);
    res.status(200).json(new ApiResponse(200, { referralLink }, "Referral link generated"));
  });

  /**
   * @User
   */
  static getPeriodEarnings = asyncHandler(async (req, res) => {
    const { _id: userId } = req.user;
    const { period } = req.query;
    logger.info(`Earnings overview request for userId: ${userId}`);
    const earnings = await ReferralService.getUserIncome(userId, period);
    logger.info(`Earnings overview fetched for userId: ${userId}`);
    res.status(200).json(new ApiResponse(200, earnings, "Earnings overview fetched"));
  });
  /**
   * @User
   */
  static getTotalEarningsTillToday = asyncHandler(async (req, res) => {
    const { _id: userId } = req.user;
    logger.info(`Earnings overview request for userId: ${userId}`);
    const earnings = await ReferralService.getUserTotalIncomeTillToday(userId);
    logger.info(`Earnings overview fetched for userId: ${userId}`);
    res.status(200).json(new ApiResponse(200, earnings, "Earnings overview fetched"));
  });
  static getReferralHistory=asyncHandler(async(req,res)=>{
    const userId = req.user.userId;
    console.log("user ",req.user)
    logger.info(`Referral history request for userId: ${userId}`)
    const history=await ReferralService.getReferralHistory(userId);
    res.status(200).json(new ApiResponse(200,history,"Referral history fetched"))
  })
}

module.exports = ReferralController;
