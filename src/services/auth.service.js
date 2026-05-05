const crypto = require("crypto");
const {
  comparePassword,
  hashPassword,
} = require("../utils/helpers/bcrypt.util");
const ApiError = require("../errors/ApiErrors");
const { logger } = require("../utils/helpers/logger.util");
const { generateJWTToken } = require("../utils/token.util");
const { FRONTEND_URL } = require("../configs/env.config");

const userRepo = require("../repositories/user.repository");
const kycRepo = require("../repositories/kyc.repository");
const otpSessionRepo = require("../repositories/otpSession.repository");
const { generateOtp, getOtpExpiry } = require("../utils/otp.util");
const MailService = require("./mail.service");
const { User } = require("../models/user.model");

class AuthService {
  async loginWithEmail({ email, password }) {
    const log = logger.child({ action: "loginWithEmail", email });

    const user = await userRepo.findByEmailWithPass(email);
    if (!user) {
      log.error("User not found");
      throw new ApiError(400, "Invalid credentials");
    }

    if (!user.password) {
      log.error("Password login attempted but password not set", {
        userId: user._id,
      });
      throw new ApiError(400, "Invalid credentials");
    }

    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      log.error("Invalid password");
      throw new ApiError(400, "Invalid credentials");
    }

    if (!user.isEmailVerified) {
      log.info("Unverified email login attempt", { userId: user._id });
      throw new ApiError(400, "Please verify your email first");
    }

    const tokens = generateJWTToken(user);
    await userRepo.updateById(user._id, { refreshToken: tokens.refreshToken });

    log.info("Login successful", { userId: user._id });
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      message: "User logged in",
    };
  }
  async sendOtp({ phone, referralCode, consents }) {
    const log = logger.child({ action: "sendOtp", phone });

    const existingUser = await User.findOne({ phone });

    if (existingUser && consents) {
      throw new ApiError(400, "investor already exists");
    }

    if (!existingUser) {
      const isValidConsents =
        consents?.isAdult === true &&
        consents?.acceptTerms === true &&
        consents?.understandRisk === true &&
        consents?.kycAgree === true &&
        consents?.fundsLegal === true &&
        consents?.notProxy === true;

      if (!isValidConsents) {
        throw new ApiError(400, "Please accept all terms and conditions");
      }
    }

    const otp = generateOtp();
    const otpExpires = getOtpExpiry();

    const existingSession = await otpSessionRepo.findByPhone(phone);

    await otpSessionRepo.upsert({
      phone,
      otp,
      otpExpires,
      referralCode: existingSession?.referralCode || referralCode || null,
      consents: {
        isAdult: !!consents?.isAdult,
        acceptTerms: !!consents?.acceptTerms,
        understandRisk: !!consents?.understandRisk,
        kycAgree: !!consents?.kycAgree,
        fundsLegal: !!consents?.fundsLegal,
        notProxy: !!consents?.notProxy,
      },
    });

    log.debug("OTP generated and sent");

    return existingUser ? "OTP sent for login" : "OTP sent for registration";
  }
  async verifyOtpAndLogin({ phone, otp }) {
    const log = logger.child({ action: "verifyOtpAndLogin", phone });

    const session = await otpSessionRepo.findByPhone(phone);

    const now = Date.now();
    if (!session || session.otp !== otp || session.otpExpires < now) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    let user = await userRepo.findByPhone(phone);
    if (!user) {
      let referrer = null;

      if (session.referralCode) {
        referrer = await userRepo.findByReferralCode(session.referralCode);
      }

      user = await userRepo.create({
        phone,
        isPhoneVerified: true,
        referredBy: referrer ? referrer._id : null,
        consents: session?.consents,
      });

      // if (referrer) {
      //   if (!referrer.leftChild) {
      //     referrer.leftChild = user._id;
      //     user.position = "left";
      //   } else if (!referrer.rightChild) {
      //     referrer.rightChild = user._id;
      //     user.position = "right";
      //   } else {
      //     console.log("Both left & right filled");
      //     // future: spillover logic
      //   }

      //   user.parentId = referrer._id;

      //   await referrer.save();
      //   await user.save();
      // }

      await kycRepo.getOrCreate(user._id);
    } else {
      await userRepo.updateById(user._id, { isPhoneVerified: true });
    }

    await otpSessionRepo.deleteByPhone(phone);

    const tokens = generateJWTToken(user);
    await userRepo.updateById(user._id, { refreshToken: tokens.refreshToken });

    log.info("OTP login successful", { userId: user._id });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    };
  }

  async resendOtp({ phone }) {
    const log = logger.child({ action: "resendOtp", phone });

    const session = await otpSessionRepo.findByPhone(phone);
    if (!session) {
      log.error("No OTP session found");
      throw new ApiError(400, "No OTP request found. Please request OTP first");
    }

    const otp = generateOtp();
    const otpExpires = getOtpExpiry();

    await otpSessionRepo.upsert({
      phone,
      otp,
      otpExpires,
      referralCode: session.referralCode, // preserve referral
    });

    // await smsService.sendOtp(phone, otp);

    log.info("OTP resent successfully");
    return "OTP resent to phone";
  }

  async initiateEmailVerification({ userId, email }) {
    const log = logger.child({ action: "initVerifyEmail", userId });

    const user = await userRepo.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires > Date.now() &&
      user.unverifiedEmail === email
    ) {
      throw new ApiError(
        429,
        "Verification already sent. Please wait before retrying.",
      );
    }

    const existing = await userRepo.findByEmail(email);
    if (existing && existing._id.toString() !== userId.toString()) {
      throw new ApiError(400, "Email already in use");
    }

    const token = crypto.randomUUID();

    await userRepo.updateById(userId, {
      unverifiedEmail: email,
      verificationToken: token,
      verificationTokenExpires: Date.now() + 15 * 60 * 1000,
    });

    MailService.sendVerifyEmail({ email, token });

    log.info("Verification email initiated", { email });
    return "Verification email sent";
  }

  async verifyEmail({ token }) {
    const log = logger.child({ action: "verifyEmail" });

    const user = await userRepo.findByVerificationToken(token);
    if (!user) {
      log.error("Invalid or expired token");
      throw new ApiError(400, "Invalid token");
    }

    await userRepo.verifyEmailById({
      userId: user._id,
      email: user.unverifiedEmail,
    });

    log.info("Email verified successfully", { userId: user._id });
    return "Email verified.";
  }

  async refreshToken({ refreshToken }) {
    const log = logger.child({ action: "refreshToken" });

    if (!refreshToken) {
      throw new ApiError(400, "Refresh token required");
    }

    const user = await userRepo.findByRefreshToken(refreshToken);

    if (!user) {
      log.error("Invalid refresh token");
      throw new ApiError(401, "Invalid refresh token");
    }

    const tokens = generateJWTToken(user);

    await userRepo.updateById(user._id, {
      refreshToken: tokens.refreshToken, // rotation
    });

    log.info("Tokens refreshed", { userId: user._id });

    return tokens;
  }

  async logout({ userId }) {
    const log = logger.child({ action: "logout", userId });

    if (!userId) {
      log.info("Logout called without userId");
      return;
    }

    await userRepo.unsetRefreshToken(userId);

    log.info("Logout completed – refresh token removed");
  }

  //! not used will be removed
  async register({
    email,
    password,
    firstName,
    lastName,
    phone,
    referralCode,
  }) {
    const log = logger.child({ action: "register" });

    const existingEmail = await userRepo.findByEmail(email);
    if (existingEmail) {
      log.error("Email already exists", { email });
      throw new ApiError(400, "User already exists with this email");
    }

    const existingPhone = await userRepo.findByPhone(phone);
    if (existingPhone) {
      log.error("Phone already exists", { phone });
      throw new ApiError(400, "User already exists with this phone number");
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await userRepo.findByReferralCode(referralCode);
      if (referrer) referredBy = referrer._id;
    }

    const verificationToken = crypto.randomUUID();
    const expires = Date.now() + 15 * 60 * 1000;

    const user = await userRepo.create({
      email,
      password: await hashPassword(password),
      verificationToken,
      verificationTokenExpires: expires,
      firstName,
      lastName,
      phone,
      referredBy,
    });

    await kycRepo.getOrCreate(user._id);

    const verificationUrl = `${FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
    // sendMail.sendVerificationMail(email, verificationUrl);

    log.info("User registered successfully", { userId: user._id });
    return "User registered please verify your email or login with phone number";
  }

  async resendVerificationEmail({ email }) {
    const log = logger.child({ action: "resendVerificationEmail" });

    const user = await userRepo.findByEmail(email);
    if (!user) {
      log.error("User not found");
      throw new ApiError(400, "User not found");
    }

    if (user.isEmailVerified) {
      log.error("Email already verified");
      throw new ApiError(400, "User is already verified");
    }

    const newToken = crypto.randomUUID();

    await userRepo.updateById(user._id, {
      verificationToken: newToken,
      // optionally reset expiry if needed
      verificationTokenExpires: Date.now() + 15 * 60 * 1000,
    });

    const verificationUrl = `${FRONTEND_URL}/auth/verify-email?token=${newToken}`;
    // sendMail.sendVerificationMail(email, verificationUrl);

    log.info("Verification email resent", { userId: user._id });
    return "Verification email sent successfully.";
  }

  async forgotPassword({ email }) {
    const log = logger.child({ action: "forgotPassword" });

    const user = await userRepo.findByEmail(email);
    if (!user) {
      log.error("User not found");
      throw new ApiError(400, "User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    await userRepo.updateById(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    // sendMail.sendResetPasswordMail(user.email, resetUrl);

    log.info("Password reset token generated", { userId: user._id });
    return "Reset password email sent";
  }

  async resetPassword({ token, newPassword }) {
    const log = logger.child({ action: "resetPassword" });

    const user = await userRepo.findByResetPasswordToken(token);
    if (!user) {
      log.error("Invalid or expired reset token");
      throw new ApiError(400, "Invalid or expired token");
    }

    await userRepo.updateById(user._id, {
      password: await hashPassword(newPassword),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    // sendMail.sendUpdatePasswordMail(user.email);

    log.info("Password reset completed", { userId: user._id });
    return "Password reset successful";
  }
}

module.exports = new AuthService();
