const mongoose = require("mongoose");
const PropertyRepo = require("../repositories/property.repository");
const InvestmentRepo = require("../repositories/investment.repository");
const KycRepo = require("../repositories/kyc.repository");
const UserRepo = require("../repositories/user.repository");
const ApiError = require("../errors/ApiErrors");
const { uploadImageToS3 } = require("../utils/helpers/aws.util");
const { KYC_STATUS } = require("../constants/app.constant");

class InvestmentService {
  static async createInvestment({ userId, body, paymentProof }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await UserRepo.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (user.isDisabled) {
        throw new ApiError(403, "User account is disabled");
      }

      // if (!user.isEmailVerified) {
      //   throw new ApiError(400, "Email not verified");
      // }

      // const kyc = await KycRepo.findByUserId(userId);

      // if (!kyc) {
      //   throw new ApiError(400, "Please complete your KYC before investing");
      // }

      // if (kyc.status !== KYC_STATUS.VERIFIED) {
      //   throw new ApiError(
      //     403,
      //     `KYC is ${kyc.status}. Investment allowed only after verification`,
      //   );
      // }

      const property = await PropertyRepo.findLiveOutlet(
        body.propertyId,
        session,
      );
      if (!property) {
        throw new ApiError(404, "Property not investable");
      }

      if (property.remainingShares < body.shares) {
        throw new ApiError(400, "Insufficient shares available");
      }

      if (!paymentProof) {
        throw new ApiError(400, "Payment proof is required");
      }

      const folderName = "payment-proofs";

      const uploadedProof = await uploadImageToS3({
        file: paymentProof,
        folderName,
      });

      const investmentRef = `INV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
  const pricePerShare=property.pricePerUnit;
  if (!pricePerShare) {
  throw new ApiError(400, "Property pricePerUnit is missing");
}


      await InvestmentRepo.create(
        {
          userId,
          propertyId: property._id,
          shares: body.shares,
          pricePerShare:  pricePerShare,
          totalAmount: pricePerShare * body.shares,
          investmentRef,
          payment: {
            utr: body.utr,
            paidAt: new Date(body.paidAt),
            proof: uploadedProof,
          },
        },
        session,
      );

      const updateResult = await PropertyRepo.reserveShares(
        property._id,
        body.shares,
        session,
      );

      if (updateResult.modifiedCount === 0) {
        throw new ApiError(
          409,
          "Shares no longer available — someone else reserved them just now",
        );
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async listMyInvestments({ userId, query }) {
    const rawPage = query?.page;
    const rawLimit = query?.limit;

    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : 10;
    const skip = (page - 1) * limit;

    const filter = { userId };

    const [items, total] = await Promise.all([
      InvestmentRepo.findUserList(filter, skip, limit),
      InvestmentRepo.count(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getMyInvestmentById({ userId, investmentId }) {
    const investment = await InvestmentRepo.findUserById({
      userId,
      investmentId,
    });

    if (!investment) {
      throw new ApiError(404, "Investment not found");
    }

    return investment;
  }
}

module.exports = InvestmentService;
