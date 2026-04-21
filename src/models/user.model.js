const { Schema, model } = require("mongoose");
const { User } = require("../constants/model.constants");
const { User_Type } = require("../constants/app.constant");
const baseTransform = require("./plugins/transform.plugin");

const UserSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    isDisabled: { type: Boolean, default: false },
    refreshToken: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    unverifiedEmail: { type: String, unique: true, sparse: true },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    password: { type: String, select: false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    role: {
      type: String,
      enum: Object.values(User_Type),
      default: User_Type.USER,
    },
    referralCode: { type: String, unique: true },
    referredBy: { type: Schema.Types.ObjectId, ref: User, default: null },

    consents: {
      isAdult: { type: Boolean, default: false },
      acceptTerms: { type: Boolean, default: false },
      understandRisk: { type: Boolean, default: false },
      kycAgree: { type: Boolean, default: false },
      fundsLegal: { type: Boolean, default: false },
      notProxy: { type: Boolean, default: false },
      acceptedAt: { type: Date },
    },
    binaryPairsPaid:{type:Number,default:0},
    leftChild: { type: Schema.Types.ObjectId, ref: "User" },
    rightChild: { type: Schema.Types.ObjectId, ref: "User" },
    parentId: { type: Schema.Types.ObjectId, ref: "User" },
    position: { type: String, enum: ["left", "right"] },
  },
 
);

// Generate unique referral code
UserSchema.pre("save", async function (next) {
  if (!this.referralCode) {
    this.referralCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();
  }
  next();
});

UserSchema.plugin(baseTransform);
const UserModel = model(User, UserSchema);
module.exports = { User: UserModel };
