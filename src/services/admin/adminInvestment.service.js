const mongoose = require("mongoose");
const InvestmentRepo = require("../../repositories/investment.repository");
const PropertyRepo = require("../../repositories/property.repository");
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
        propertyId: investment.propertyId,
      });

      const user = await userRepository.findById(investment.userId);
      const property = await PropertyRepo.findById(
        investment.propertyId,
        session,
      );
      // 1. soldShares update karo
      await PropertyRepo.incrementSoldShares(
        investment.propertyId,
        investment.shares,
        session,
      );

      // 2. updated property lo
      const updatedProperty = await PropertyRepo.findById(
        investment.propertyId,
        session,
      );

      // 3. check karo sold hai ya nahi
      if (updatedProperty.soldShares >= updatedProperty.totalShares) {
        await PropertyRepo.markAsSold(investment.propertyId, session);
      } else {
        await PropertyRepo.markAsAvailable(investment.propertyId, session);
      }
      const invoiceNumber = `INV-${Date.now()}`;
      let pdfBuffer = null;

      // We will skip PDF generation if ejs template doesn't exist, but keep logic
    
      try {
        const invoiceHtml = await ejs.renderFile(
          path.join(process.cwd(), "src/views/emails/investment_invoice.ejs"),
          {
            investment,
            user,
            property,
            invoiceNumber,
          },
        );
        pdfBuffer = await generateInvoicePDFBuffer(invoiceHtml);
        const fileName = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}.pdf`;
        await uploadPDFToS3(pdfBuffer,fileName);

        await InvestmentRepo.updateInvoice(
          investment._id,
          {
            invoiceNumber: invoiceNumber,
            file: {
              key: `invoices/${fileName}`,
              originalName: fileName,
              mimeType: "application/pdf",
            },
            generatedAt: new Date(),
          },
          session,
        );
      } catch (e) {
        log.warn("Invoice generation failed, skipping.", e);
      }

      try {
        await mailProvider.send({
          to: user.email,
          subject: "Your Investment Invoice",
          template: "invoice_email",
          context: {
            investment,
            user,
            property,
            invoiceNumber,
          },
          attachments: pdfBuffer
            ? [
                {
                  filename: `Invoice-${invoiceNumber}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : [],
        });
      } catch (e) {
        log.warn("Mail sending failed, skipping.", e);
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
    if (!reason || reason.trim().length < 1) {
      log.warn("Invalid rejection reason");
      throw new ApiError(400, "Rejection reason must be at least 1 characters");
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

      const result = await PropertyRepo.markAsAvailable(
        investment.propertyId,
        session,
      );
      if (result.modifiedCount === 0) {
        log.warn("Property release returned zero modifiedCount", {
          propertyId: investment.propertyId,
        });
      }

      const user = await userRepository.findById(investment.userId);
      const property = await PropertyRepo.findById(
        investment.propertyId,
        session,
      );

      try {
        await mailProvider.send({
          to: user.email,
          subject: "Update on Your Investment Request",
          template: "investment_rejected",
          context: {
            user,
            property,
            investment,
            reason,
          },
        });
      } catch (e) {
        log.warn("Mail sending failed, skipping.", e);
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

  static async listInvestments({ status, propertyId, page, limit, search }) {
    const filter = {};
    if (status) filter.status = status;
    if (propertyId) filter.propertyId = propertyId;
    const safePage =
      Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit =
      Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const skip = (safePage - 1) * safeLimit;
    const [items, total] = await Promise.all([
      InvestmentRepo.findAdminList(filter, skip, safeLimit, search),
      InvestmentRepo.count(filter, search),
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
