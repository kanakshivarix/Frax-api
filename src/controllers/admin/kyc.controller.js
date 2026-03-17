const AdminKycService = require("../../services/admin/kyc.service");
const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");

class KycAdminController {
  static listKycs = asyncHandler(async (req, res) => {
    const result = await AdminKycService.listKycs(req.query);
    return res.sendRes(200, result);
  });

  static getSingleKyc = asyncHandler(async (req, res) => {
    const result = await AdminKycService.getSingleKyc({
      userId: req.params.userId,
    });
    return res.sendRes(200, result);
  });

  static updateStep = asyncHandler(async (req, res) => {
    const { userId, step, status, rejectionReason } = req.body;

    const result = await AdminKycService.updateKycStep({
      userId,
      step,
      status,
      rejectionReason,
    });

    return res.sendRes(200, result, "KYC updated successfully");
  });

  static getKycDocument = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const { imageId } = req.params;

    const result = await AdminKycService.getKycDocument({
      userId,
      imageId,
    });

    return res.sendRes(200, result, "Document URL generated");
  });
}

module.exports = KycAdminController;
