const { Schema, model } = require("mongoose");
const { constants } = require("../utils/constants/history.constant");

const ReferralEarningSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Who earns
    referredUserId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Referred user
    propertyId: { type: Schema.Types.ObjectId, ref: "Property" }, // Property for referral
    type: { type: String, enum: Object.values(constants.Earning_Type), required: true },
    totalAmount: { type: Number, required: true }, // e.g., ₹50 for direct
    paidAmount: { type: Number, default: 0 }, // Amount already paid
    status: {
      type: String,
      enum: Object.values(constants.Earning_Status),
      default: constants.Earning_Status.PENDING,
    },
    payoutSchedule: {
      type: String,
      enum: Object.values(constants.Payout_Schedule),
      default: constants.Payout_Schedule.DAILY,
    }, // Admin decides
    period: { type: String }, // e.g., "2025-05" for monthly referral
    lastPayoutDate: { type: Date },
  },
  { timestamps: true }
);

const ReferralEarning = model("ReferralEarning", ReferralEarningSchema);

module.exports = { ReferralEarning };
