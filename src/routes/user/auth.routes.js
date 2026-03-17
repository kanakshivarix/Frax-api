const express = require("express");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const validation = require("../../validator/auth.validator");
const AuthController = require("../../controllers/auth.controller");
const { authMiddleware } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.route("/login").post(validate(validation.login), AuthController.loginWithEmail);

router.route("/send-otp").post(validate(validation.sendOtp), AuthController.sendOtp);

router.route("/verify-otp").post(validate(validation.verifyOtp), AuthController.verifyOtpAndLogin);

router.route("/re-send-otp").post(validate(validation.resendOtp), AuthController.resendOtp);

router.route("/refresh").post(AuthController.refresh);

router
  .route("/init-verify-email")
  .post(
    validate(validation.initiateEmailVerification),
    authMiddleware,
    AuthController.initiateEmailVerification,
  );

router
  .route("/verify-email")
  .get(validate(validation.verifyEmail, REQUEST_TARGET.QUERY), AuthController.verifyEmail);

router.route("/logout").get(authMiddleware, AuthController.logout);

// router
//   .route("/register")
//   .post(
//     validate(validation.RegisterWithReferCode, REQUEST_TARGET.QUERY),
//     validate(validation.Register),
//     AuthController.register,
//   );

// router
//   .route("/resend-verification")
//   .post(validate(validation.SendEmail), AuthController.resendVerificationEmail);

// router
//   .route("/forget-password")
//   .post(validate(validation.SendEmail), AuthController.forgetPassword);

// router
//   .route("/reset-password")
//   .post(validate(validation.ResetPassword), AuthController.resetPassword);

module.exports = router;
