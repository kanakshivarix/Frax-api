const { Schema, model } = require("mongoose");
const { OtpSession } = require("../constants/model.constants");

const OtpSessionSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    referralCode: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

// Auto-delete after expiry (TTL index)
OtpSessionSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = model(OtpSession, OtpSessionSchema);
