const ApiError = require("../errors/ApiErrors");
const userRepo = require("../repositories/user.repository");
const kycRepo = require("../repositories/kyc.repository");
const { comparePassword, hashPassword } = require("../utils/helpers/bcrypt.util");
const { logger } = require("../utils/helpers/logger.util");
const { KYC_STATUS } = require("../constants/app.constant");

class UserService {
  static async checkUser({ userId }) {
    const log = logger.child({ action: "checkUser", userId });

    const user = await userRepo.findByIdSafe(userId);
    if (!user) {
      log.warn("User not found");
      throw new ApiError(404, "User not found");
    }

    const kyc = await kycRepo.findByUserId(userId);
    if (!kyc) {
      return {
        user,
        kyc: {
          status: KYC_STATUS.NOT_SUBMITTED,
          nextStep: "pan",
          rejectedStep: null,
          prompt: "Complete your KYC to continue",
        },
      };
    }

    return {
      user,
      kyc: {
        overallStatus: kyc.status,
        pan: kyc.pan?.status ?? "NOT_SUBMITTED",
        aadhaar: kyc.aadhaar?.status ?? "NOT_SUBMITTED",
        bank: kyc.bankDetails?.status ?? "NOT_SUBMITTED",
      },
    };
  }

  static async updateUserDetail({ userId, updateData }) {
    const log = logger.child({ action: "updateUserDetail", userId });

    const user = await userRepo.updateById(userId, updateData);
    if (!user) {
      log.warn("User not found");
      throw new ApiError(404, "User not found");
    }

    log.info("User updated");
    return user;
  }

  static async changePassword({ userId, currentPassword, newPassword }) {
    const log = logger.child({ action: "changePassword", userId });

    const user = await userRepo.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const ok = await comparePassword(currentPassword, user.password);
    if (!ok) {
      throw new ApiError(400, "Incorrect current password");
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    log.info("Password changed");
  }
}

module.exports = UserService;
