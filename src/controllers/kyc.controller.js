const { asyncHandler } = require("../utils/helpers/asyncHandler.util");
const KycService = require("../services/kyc.service");

class KycController {
  static submitPan = asyncHandler(async (req, res) => {
    await KycService.submitPan({
      userId: req.user.userId,
      panNumber: req.body.panNumber,
      file: req.files.front?.[0],
    });

    return res.sendRes(200, null, "Pan submitted successfully");
  });

  static submitAadhaar = asyncHandler(async (req, res) => {
    await KycService.submitAadhaar({
      userId: req.user.userId,
      aadhaarNumber: req.body.aadhaarNumber,
      front: req.files.front?.[0],
      back: req.files.back?.[0],
    });

    return res.sendRes(200, null, "Aadhaar submitted successfully");
  });

  static submitBank = asyncHandler(async (req, res) => {
    await KycService.submitBank({
      userId: req.user.userId,
      body: req.body,
      proofs: req.files?.proofs || [],
    });
    return res.sendRes(200, null, "Bank details submitted successfully");
  });

  static submitAddress = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    await KycService.submitAddress({
      userId,
      address: req.body,
    });

    return res.sendRes(200, null, "Address submitted successfully");
  });

  static getKycStatus = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const result = await KycService.getKycStatus({ userId });

    return res.sendRes(200, result);
  });

static submitSelfie = asyncHandler(async (req, res) => {
  await KycService.submitSelfie({
    userId: req.user.userId,
    files: req.files?.image || [],
  });

  return res.sendRes(200, null, "Selfie uploaded successfully");
});
}
module.exports = KycController;
