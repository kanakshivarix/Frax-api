const schedule = require("node-schedule");
const ReferralEarning = require("../../models/referralEarning.model");
const { logger } = require("../utils/helpers/logger.util");
const IncomeService = require("../../services/income.service");

exports.startPayoutScheduler = () => {
  // Daily payouts
  schedule.scheduleJob("0 0 * * *", async () => {
    logger.info("Running daily payout job");
    try {
      const earnings = await ReferralEarning.find({
        payoutSchedule: "daily",
        status: { $ne: "paid" },
      });
      for (const earning of earnings) {
        const remainingAmount = earning.totalAmount - earning.paidAmount;
        if (remainingAmount <= 0) {
          earning.status = "paid";
          await earning.save();
          continue;
        }
        const dailyAmount =
          earning.type === "direct_bonus" ? earning.totalAmount / 100 : remainingAmount; // ₹15/day for direct
        earning.paidAmount += dailyAmount;
        earning.lastPayoutDate = new Date();
        earning.status = earning.paidAmount >= earning.totalAmount ? "paid" : "partially_paid";
        await earning.save();
        logger.info(`Payout ₹${dailyAmount} to user ${earning.userId}`);
      }
    } catch (error) {
      logger.error(`Error in daily payout: ${error.message}`);
    }
  });

  // Weekly payouts
  schedule.scheduleJob("0 0 * * 0", async () => {
    logger.info("Running weekly payout job");
    try {
      const earnings = await ReferralEarning.find({
        payoutSchedule: "weekly",
        status: { $ne: "paid" },
      });
      for (const earning of earnings) {
        const remainingAmount = earning.totalAmount - earning.paidAmount;
        if (remainingAmount <= 0) {
          earning.status = "paid";
          await earning.save();
          continue;
        }
        const weeklyAmount =
          earning.type === "direct_bonus" ? (earning.totalAmount / 100) * 7 : remainingAmount; // 7 days’ worth
        earning.paidAmount += weeklyAmount;
        earning.lastPayoutDate = new Date();
        earning.status = earning.paidAmount >= earning.totalAmount ? "paid" : "partially_paid";
        await earning.save();
        logger.info(`Payout ₹${weeklyAmount} to user ${earning.userId}`);
      }
    } catch (error) {
      logger.error(`Error in weekly payout: ${error.message}`);
    }
  });

  // Monthly payouts
  schedule.scheduleJob("0 0 1 * *", async () => {
    logger.info("Running monthly payout job");
    try {
      const earnings = await ReferralEarning.find({
        payoutSchedule: "monthly",
        status: { $ne: "paid" },
      });
      for (const earning of earnings) {
        const remainingAmount = earning.totalAmount - earning.paidAmount;
        if (remainingAmount <= 0) {
          earning.status = "paid";
          await earning.save();
          continue;
        }
        const monthlyAmount = remainingAmount; // Pay full remaining amount
        earning.paidAmount += monthlyAmount;
        earning.lastPayoutDate = new Date();
        earning.status = "paid";
        await earning.save();
        logger.info(`Payout ₹${monthlyAmount} to user ${earning.userId}`);
      }
    } catch (error) {
      logger.error(`Error in monthly payout: ${error.message}`);
    }
  });

  // Generate monthly EV referral earnings
  schedule.scheduleJob("0 0 1 * *", async () => {
    logger.info("Running monthly referral earnings generator");
    try {
      const period = new Date().toISOString().slice(0, 7); // "2025-05"

      const result = await IncomeService.distributeIncome(period);
      logger.info(
        `Generated ${result.referralEarnings.length} monthly referral earnings and ${result.distributions.length} distributions for period: ${period}`
      );
    } catch (err) {
      logger.error(`Error generating monthly referral earnings: ${err.message}`);
    }
  });
};
