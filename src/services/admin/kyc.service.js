const kycRepo = require("../../repositories/kyc.repository");
const ApiError = require("../../errors/ApiErrors");
const { KYC_STATUS } = require("../../constants/app.constant");
const { logger } = require("../../utils/helpers/logger.util");
const { getSignedUrlFromS3 } = require("../../utils/helpers/aws.util");

class AdminKycService {
  async updateKycStep({
    userId,
    step, // "pan" | "aadhaar" | "bankDetails"
    status,
    rejectionReason,
  }) {
    const log = logger.child({ action: "updateKycDoc", userId, step, status });
    if (!["pan", "aadhaar", "bankDetails"].includes(step)) {
      throw new ApiError(400, "Invalid KYC step");
    }

    if (![KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED].includes(status)) {
      throw new ApiError(400, "Invalid KYC status");
    }

    if (status === KYC_STATUS.REJECTED && !rejectionReason) {
      throw new ApiError(400, "Rejection reason is required");
    }

    log.info("update kyc start");
    return kycRepo.updateStepStatus({
      userId,
      step,
      status,
      rejectionReason,
    });
  }

  async getKycDocument({ userId, imageId }) {
    const log = logger.child({ action: "getKycDocument", userId, imageId });

    const image = await kycRepo.findImageById({
      userId,
      imageId,
    });

    if (!image) {
      throw new ApiError(404, "Document not found");
    }

    const url = await getSignedUrlFromS3(image.key);

    log.info("Signed URL generated");

    return {
      url,
      expiresIn: 3600,
    };
  }

  async listKycs({ page, limit, status, search }) {
    const log = logger.child({ action: "adminListKycs" });

    page = Number.isInteger(+page) && +page > 0 ? +page : 1;
    limit = Number.isInteger(+limit) && +limit > 0 ? +limit : 10;

    const result = await kycRepo.list({
      page,
      limit,
      status,
      search,
    });

    log.info("KYC list fetched", {
      total: result.total,
      page,
      limit,
    });

    return result;
  }

  async getSingleKyc({ userId }) {
    const log = logger.child({ action: "adminGetSingleKyc", userId });

    const kyc = await kycRepo.findForAdminDetail(userId);
    if (!kyc) {
      throw new ApiError(404, "KYC not found");
    }

    log.info("Single KYC fetched");
    return kyc;
  }
}

module.exports = new AdminKycService();
