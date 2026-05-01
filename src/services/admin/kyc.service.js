const kycRepo = require("../../repositories/kyc.repository");
const ApiError = require("../../errors/ApiErrors");
const { KYC_STATUS } = require("../../constants/app.constant");
const { logger } = require("../../utils/helpers/logger.util");
const { getSignedUrlFromS3 } = require("../../utils/helpers/aws.util");
const archiver = require('archiver');
const axios = require('axios');

class AdminKycService {
  async updateKycStep({
    userId,
    step, // "pan" | "aadhaar" | "bankDetails"
    status,
    rejectionReason,
  }) {
    const log = logger.child({ action: "updateKycDoc", userId, step, status });
    if (!["pan", "aadhaar", "bankDetails", "selfie"].includes(step)) {
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

    const url = await getSignedUrlFromS3(image.key, {
      download: true,
      fileName: image?.originalName || "document.jpg",
    });

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

  async downloadAllKycAsZip({ userId, res }) {
    // 1. Fetch KYC details from Repo
    const kyc = await kycRepo.findForAdminDetail(userId);
    if (!kyc) throw new ApiError(404, "KYC record not found");

    // 2. Setup Archiver
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Important: Handle archiver errors
    archive.on('error', (err) => {
      logger.error("ZIP Archiver Error:", err);
      // Agar response start nahi hua toh error bhej sakte hain
      if (!res.headersSent) {
        res.status(500).send({ success: false, message: "Could not generate zip" });
      }
    });

    // 3. Set Headers and Pipe
    res.attachment(`KYC_${userId}.zip`);
    archive.pipe(res);

    // 4. Helper function to fetch and append
    const addImage = async (imageObj, folder, name) => {
      if (imageObj && imageObj.key) {
        try {
          const url = await getSignedUrlFromS3(imageObj.key);
          const response = await axios.get(url, { responseType: 'stream', timeout: 10000 });
          archive.append(response.data, { name: `${folder}/${name}.jpg` });
        } catch (err) {
          logger.error(`Failed to add ${name} to zip: ${err.message}`);
          // Hum crash nahi karenge, bas ye image skip ho jayegi
        }
      }
    };

    // 5. Sequential processing (Wait for each step to finish)
    
    // PAN
    if (kyc.pan?.front) await addImage(kyc.pan.front, 'PAN', 'pan_front');

    // Aadhaar
    if (kyc.aadhaar?.front) await addImage(kyc.aadhaar.front, 'Aadhaar', 'aadhaar_front');
    if (kyc.aadhaar?.back) await addImage(kyc.aadhaar.back, 'Aadhaar', 'aadhaar_back');

    // Bank Proofs (Using for...of for safe async looping)
    if (kyc.bankDetails?.proofs?.length) {
      let i = 1;
      for (const proof of kyc.bankDetails.proofs) {
        await addImage(proof, 'Bank', `proof_${i++}`);
      }
    }

    // Selfie
    if (kyc.selfie?.image?.length) {
      let j = 1;
      for (const img of kyc.selfie.image) {
        await addImage(img, 'Selfie', `selfie_${j++}`);
      }
    }

    // 6. FINAL STEP: Finalize the archive
    await archive.finalize();
  }
}

module.exports = new AdminKycService();
