const mongoose = require("mongoose");
const InvestmentRepo = require("../../repositories/investment.repository");
const CafeOutletRepo = require("../../repositories/cafeOutlet.repository");
const ApiError = require("../../errors/ApiErrors");
const { logger } = require("../../utils/helpers/logger.util");

class AdminInvestmentService {
  static async approveInvestment({ investmentId, adminId }) {
    const log = logger.child({
      module: "AdminInvestmentService",
      action: "approveInvestment",
      investmentId,
      adminId,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const investment = await InvestmentRepo.approve(investmentId, adminId, session);
      if (!investment) {
        log.warn("Investment not approvable");
        throw new ApiError(400, "Investment not approvable");
      }

      const outlet = await CafeOutletRepo.findById(investment.outletId, session);

      if (outlet?.status === "LIVE" && outlet.soldShares >= outlet.totalShares) {
        log.info("Outlet became fully funded", {
          outletId: outlet._id,
        });

        await CafeOutletRepo.setStatusToFullyFunded(outlet._id, session);
      }

      await session.commitTransaction();

      log.info("Investment approved");
      return { success: true };
    } catch (err) {
      await session.abortTransaction();
      log.error({ err }, "Approval failed");
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async rejectInvestment({ investmentId, reason, adminId }) {
    const log = logger.child({
      module: "AdminInvestmentService",
      action: "rejectInvestment",
      investmentId,
      adminId,
    });

    if (!reason || reason.trim().length < 10) {
      log.warn("Invalid rejection reason");
      throw new ApiError(400, "Rejection reason must be at least 10 characters");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const investment = await InvestmentRepo.findById(investmentId, session);
      if (!investment || investment.status !== "PAYMENT_UPLOADED") {
        log.warn("Investment not rejectable", { status: investment?.status });
        throw new ApiError(400, "Investment not found or not in pending state");
      }

      await InvestmentRepo.reject(investmentId, reason, adminId, session);

      const result = await CafeOutletRepo.releaseShares(
        investment.outletId,
        investment.shares,
        session,
      );

      if (result.modifiedCount === 0) {
        log.warn("Share release returned zero modifiedCount", {
          outletId: investment.outletId,
          shares: investment.shares,
        });
      }

      await session.commitTransaction();

      log.info("Investment rejected");
      return { success: true };
    } catch (err) {
      await session.abortTransaction();
      log.error({ err }, "Rejection failed");
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async listInvestments({ status, outletId, page, limit }) {
    const filter = {};
    if (status) filter.status = status;
    if (outletId) filter.outletId = outletId;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      InvestmentRepo.findAdminList(filter, skip, safeLimit),
      InvestmentRepo.count(filter),
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

  static async getInvestmentById(investmentId) {
    const investment = await InvestmentRepo.findAdminById(investmentId);

    if (!investment) {
      throw new ApiError(404, "Investment not found");
    }

    return investment;
  }
}

module.exports = AdminInvestmentService;
