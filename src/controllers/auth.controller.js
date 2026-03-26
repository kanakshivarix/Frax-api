const authService = require("../services/auth.service");
const { asyncHandler } = require("../utils/helpers/asyncHandler.util");

class AuthController {
  static loginWithEmail = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const result = await authService.loginWithEmail({ email, password });

    return res.sendRes(200, result, "Login Success");
  });

  static sendOtp = asyncHandler(async (req, res) => {
  const { phone, referralCode, consents } = req.body;

  const message = await authService.sendOtp({
    phone,
    referralCode,
    consents,
  });

  return res.sendRes(200, null, message);
});

  static resendOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    const message = await authService.resendOtp({ phone });

    return res.sendRes(200, null, message);
  });

  static verifyOtpAndLogin = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    const result = await authService.verifyOtpAndLogin({ phone, otp });

    return res.sendRes(200, result, "Login Success");
  });

  static initiateEmailVerification = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { email } = req.body;
    const message = await authService.initiateEmailVerification({ userId, email });

    return res.sendRes(200, null, message);
  });

  static verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    const message = await authService.verifyEmail({ token });

    return res.sendRes(200, null, message);
  });

  static refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshToken({ refreshToken });

    return res.sendRes(200, tokens, "Token refreshed successfully");
  });

  static logout = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?._id;

    if (userId) {
      await authService.logout({ userId });
    }

    return res.sendRes(200, null, "Logged out successfully");
  });

  // not used
  static register = asyncHandler(async (req, res) => {
    const { email, phone, password, fullname } = req.body;
    const { referralCode } = req.query;

    const message = await authService.register({
      email,
      password,
      phone,
      fullname,
      referralCode,
    });

    return res.sendRes(201, null, message);
  });

  static resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const message = await authService.resendVerificationEmail({ email });

    return res.sendRes(200, null, message);
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const message = await authService.forgotPassword({ email });

    return res.sendRes(200, null, message);
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    const message = await authService.resetPassword({ token, newPassword });

    return res.sendRes(200, null, message);
  });
}

module.exports = AuthController;
