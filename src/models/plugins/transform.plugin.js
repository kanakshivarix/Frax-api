module.exports = function baseTransform(schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;

      // 🔥 strip sensitive fields globally
      delete ret.password;
      delete ret.refreshToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      delete ret.otp;
      delete ret.otpExpires;
      delete ret.verificationToken;
      delete ret.verificationTokenExpires;
      return ret;
    },
  });

  schema.set("toObject", {
    virtuals: true,
    versionKey: false,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });
};
