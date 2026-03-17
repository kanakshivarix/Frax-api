const { User } = require("../models/index.model");

class UserRepository {
  async findById(userId) {
    return User.findById(userId);
  }

  async findByIdSafe(id) {
    return User.findById(id).select(
      "-password -refreshToken -resetPasswordToken -verificationToken",
    );
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findByEmailWithPass(email) {
    return User.findOne({ email }).select("+password");
  }

  async findByPhone(phone) {
    return User.findOne({ phone });
  }

  async findByReferralCode(referralCode) {
    return User.findOne({ referralCode });
  }

  async findByVerificationToken(token) {
    return User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
  }

  async findByResetPasswordToken(token) {
    return User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  async findByRefreshToken(refreshToken) {
    return User.findOne({ refreshToken });
  }

  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  async updateOne(filter, updateData) {
    return User.updateOne(filter, updateData);
  }

  async unsetRefreshToken(userId) {
    return User.updateOne({ _id: userId }, { $unset: { refreshToken: 1 } });
  }

  async verifyEmailById({ userId, email }) {
    return User.updateOne(
      { _id: userId },
      {
        $set: {
          email,
          isEmailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        },
        $unset: {
          unverifiedEmail: 1,
        },
      },
    );
  }
}

module.exports = new UserRepository();
