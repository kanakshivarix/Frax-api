const mongoose = require("mongoose");
const InvestmentRepo = require("../../repositories/investment.repository");
const CafeOutletRepo = require("../../repositories/cafeOutlet.repository");
const ApiError = require("../../errors/ApiErrors");
const { logger } = require("../../utils/helpers/logger.util");
const s3Util = require("../../utils/helpers/aws.util");
const userRepository = require("../../repositories/user.repository");
const { ReferralService } = require("../referral.service");
const {
  generateInvoicePDF,
  generateInvoicePDFBuffer,
  uploadPDFToS3,
} = require("../../utils/helpers/invoice.util");
const mailProvider = require("../../utils/mails/mail.provider");
const ejs = require("ejs");
const path = require("path");
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
      const investment = await InvestmentRepo.approve(
        investmentId,
        adminId,
        session,
      );
      if (!investment) {
        log.warn("Investment not approvable");
        throw new ApiError(400, "Investment not approvable");
      }

      // Trigger referral earnings
      
      await ReferralService.createDirectReferralBonus({
        userId: investment.userId,
        shares: investment.shares,
        sharePrice: investment.pricePerShare || 0,
        outletId: investment.outletId,
      });
      await ReferralService.createBinaryIncome(
        investment.userId,
        investment.outletId,
        investment.totalAmount
      );

      const user = await userRepository.findById(investment.userId);
      const outlet = await CafeOutletRepo.findById(investment.outletId, session);
      const invoiceNumber = `INV-${Date.now()}`;
      const invoiceHtml = await ejs.renderFile(
        path.join(process.cwd(), "src/views/emails/investment_invoice.ejs"),
        {
          investment,
          user,
          outlet,
          invoiceNumber,
        },
      );
      
      const pdfBuffer = await generateInvoicePDFBuffer(invoiceHtml);
      const fileName = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}.pdf`;
      const uploadedInvoice = await uploadPDFToS3(pdfBuffer, fileName);
      await InvestmentRepo.updateInvoice(
        investment._id,
        {
          invoiceNumber: invoiceNumber,
          file: {
            key: `invoices/${fileName}`,
            originalName: fileName,
            mimeType: "application/pdf"
          },
          generatedAt: new Date(),
        },
        session,
      );
      await mailProvider.send({
        to: user.email,
        subject: "Your Investment Invoice",
        template: "invoice_email",
        context: {
          investment,
          user,
          outlet,
          invoiceNumber,
          pdfUrl: uploadedInvoice,
        },
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
          },
        ],
      });
      if (
        outlet?.status === "LIVE" &&
        outlet.soldShares >= outlet.totalShares
      ) {
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
      throw new ApiError(
        400,
        "Rejection reason must be at least 10 characters",
      );
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
    const investmentData = investment.toObject();
    if (investmentData.payment?.proof?.key) {
      try {
        const signedUrl = await s3Util.getSignedUrlFromS3(
          investmentData.payment.proof.key,
        );
        investmentData.payment.proof.url = signedUrl;
        logger.info("Signed URL generated successfully", { investmentId });
      } catch (err) {
        logger.error({ err }, "Failed to generate signed URL");
      }
    }
    if (investmentData.invoice?.file?.key) {
      try {
        const signedUrl = await s3Util.getSignedUrlFromS3(
          investmentData.invoice.file.key,
          {
            download: true,
            fileName: investmentData.invoice.file.originalName,
          },
        );
        investmentData.invoice.file.url = signedUrl;
        logger.info("invoice signed url generated successfully", {
          investmentId,
        });
      } catch (err) {
        logger.error({ err }, "Invoice signed url error");
      }
    }
    return investmentData;
  }
}
module.exports = AdminInvestmentService;