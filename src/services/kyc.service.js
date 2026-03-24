const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");

const kycRepo = require("../repositories/kyc.repository");
const { uploadDocumentToS3, deleteFromS3 } = require("../utils/helpers/aws.util");
const { KYC_STATUS } = require("../constants/app.constant");

class KycService {
  async submitPan({ userId, panNumber, file }) {
    const log = logger.child({ action: "submitPan", userId });

    const existing = await kycRepo.findByUserId(userId);

    const panStatus = existing?.pan?.status ?? KYC_STATUS.NOT_SUBMITTED;

    if (panStatus && ![KYC_STATUS.NOT_SUBMITTED, KYC_STATUS.REJECTED].includes(panStatus)) {
      throw new ApiError(403, `PAN is already ${panStatus}. You cannot re-submit at this stage.`);
    }

    if (panStatus === KYC_STATUS.VERIFIED && existing.pan.number !== panNumber) {
      throw new ApiError(403, "PAN number cannot be changed once verified");
    }

    if (!file) {
      throw new ApiError(400, "PAN front image is required");
    }

    let image;

    try {
      image = await uploadDocumentToS3({
        file,
        folderName: `kyc/${userId}/pan`,
      });

      await kycRepo.upsertPan({
        userId,
        panNumber,
        image,
      });

      log.info("PAN submitted");
    } catch (error) {
      if (image?.key) {
        await deleteFromS3(image.key).catch((e) => log.error("Cleanup failed", e));
      }
      throw error;
    }
  }

  async submitAadhaar({ userId, aadhaarNumber, front, back }) {
    const log = logger.child({ action: "submitAadhaar", userId });

    const existing = await kycRepo.findByUserId(userId);

    const aadhaarStatus = existing?.aadhaar?.status ?? KYC_STATUS.NOT_SUBMITTED;

    if (aadhaarStatus && ![KYC_STATUS.NOT_SUBMITTED, KYC_STATUS.REJECTED].includes(aadhaarStatus)) {
      throw new ApiError(
        403,
        `Aadhaar is already ${aadhaarStatus}. You cannot re-submit at this stage.`,
      );
    }

    if (aadhaarStatus === KYC_STATUS.VERIFIED && existing.aadhaar.number !== aadhaarNumber) {
      throw new ApiError(403, "Aadhaar number cannot be changed once verified");
    }

    if (!front || !back) {
      throw new ApiError(400, "Both Aadhaar front and back images required");
    }
    let frontImg;
    let backImg;
    try {
      frontImg = await uploadDocumentToS3({
        file: front,
        folderName: `kyc/${userId}/aadhaar`,
      });

      backImg = await uploadDocumentToS3({
        file: back,
        folderName: `kyc/${userId}/aadhaar`,
      });

      await kycRepo.upsertAadhaar({
        userId,
        aadhaarNumber,
        front: frontImg,
        back: backImg,
      });

      log.info("Aadhaar submitted");
    } catch (error) {
      if (frontImg?.key) {
        await deleteFromS3(frontImg.key).catch((e) => log.error("Cleanup failed", e));
      }
      if (backImg?.key) {
        await deleteFromS3(backImg.key).catch((e) => log.error("Cleanup failed", e));
      }
      throw error;
    }
  }

  async submitBank({ userId, body, proofs }) {
  
    const log = logger.child({ action: "submitBank", userId });

    const existing = await kycRepo.findByUserId(userId);
    const bankStatus = existing?.bankDetails?.status ?? KYC_STATUS.NOT_SUBMITTED;

    // 1️⃣ VERIFIED → immutable
    if (bankStatus === KYC_STATUS.VERIFIED) {
      throw new ApiError(403, "Bank details are already verified");
    }

    if (bankStatus && ![KYC_STATUS.NOT_SUBMITTED, KYC_STATUS.REJECTED].includes(bankStatus)) {
      throw new ApiError(
        403,
        `Bank details are already ${bankStatus}. You cannot re-submit at this stage.`,
      );
    }

    if (!proofs || proofs.length === 0) {
      throw new ApiError(400, "Bank proof document required");
    }

    let uploadedProofs = [];

    try {
      for (const file of proofs) {
        uploadedProofs.push(
          await uploadDocumentToS3({
            file,
            folderName: `kyc/${userId}/bank`,
          }),
        );
      }

      await kycRepo.upsertBank({
        userId,
        ...body,
        proofs: uploadedProofs,
      });

      log.info("Bank details submitted");
    } catch (error) {
      await Promise.allSettled(
        uploadedProofs.map((proof) =>
          deleteFromS3(proof.key).catch((e) => log.error("Cleanup failed", e)),
        ),
      );
      throw error;
    }
  }

  async submitAddress({ userId, address }) {
    const log = logger.child({ action: "submitAddress", userId });

    await kycRepo.upsertAddress({
      userId,
      address,
    });

    log.info("Address submitted");
  }
  async submitSelfie({ userId, files }) {
  const existing = await kycRepo.findByUserId(userId);

  const selfieStatus = existing?.selfie?.status ?? KYC_STATUS.NOT_SUBMITTED;

  if (selfieStatus && ![KYC_STATUS.NOT_SUBMITTED, KYC_STATUS.REJECTED].includes(selfieStatus)) {
    throw new ApiError(403, `Selfie already ${selfieStatus}`);
  }

  if (!files || files.length === 0) {
    throw new ApiError(400, "Selfie image required");
  }

  let uploaded = [];

  try {
    for (const file of files) {
      uploaded.push(
        await uploadDocumentToS3({
          file,
          folderName: `kyc/${userId}/selfie`,
        }),
      );
    }

    const doc = await kycRepo.getOrCreate(userId);

    doc.selfie = {
      image: uploaded,
      status: KYC_STATUS.SUBMITTED,
      rejectionReason: null,
      verifiedAt: null,
    };

    doc.status = kycRepo._computeGlobalStatusFromDoc(doc);

    await doc.save();

  } catch (err) {
    throw err;
  }
}

  async getKycStatus({ userId }) {
    const kyc = await kycRepo.findByUserId(userId);

    if (!kyc) {
      return {
        status: KYC_STATUS.NOT_SUBMITTED,
        steps: {
          pan: KYC_STATUS.NOT_SUBMITTED,
          aadhaar: KYC_STATUS.NOT_SUBMITTED,
          bank: KYC_STATUS.NOT_SUBMITTED,
          selfie:KYC_STATUS.NOT_SUBMITTED
        },
      };
    }

    return {
      status: kyc.status,
      steps: {
        pan: {
          status: kyc.pan?.status,
          rejectionReason: kyc.pan?.status === KYC_STATUS.REJECTED ? kyc.pan.rejectionReason : null,
        },
        aadhaar: {
          status: kyc.aadhaar?.status,
          rejectionReason:
            kyc.aadhaar?.status === KYC_STATUS.REJECTED ? kyc.aadhaar.rejectionReason : null,
        },
        bank: {
          status: kyc.bankDetails?.status,
          rejectionReason:
            kyc.bankDetails?.status === KYC_STATUS.REJECTED
              ? kyc.bankDetails.rejectionReason
              : null,
        },
         selfie: { // ✅ ADD
    status: kyc.selfie?.status,
    rejectionReason:
      kyc.selfie?.status === KYC_STATUS.REJECTED
        ? kyc.selfie.rejectionReason
        : null,
  },
      },
    };
  }
}

module.exports = new KycService();
