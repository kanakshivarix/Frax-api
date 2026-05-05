const { Schema, model } = require("mongoose");
const { OtpSession } = require("../constants/model.constants");

const OtpSessionSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    referralCode: { type: String, default: null },
     consents: {
      isAdult: { type: Boolean, default: false },
      acceptTerms: { type: Boolean, default: false },
      understandRisk: { type: Boolean, default: false },
      kycAgree: { type: Boolean, default: false },
      fundsLegal: { type: Boolean, default: false },
      notProxy: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  },
);

// Auto-delete after expiry (TTL index)
OtpSessionSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = model(OtpSession, OtpSessionSchema);
