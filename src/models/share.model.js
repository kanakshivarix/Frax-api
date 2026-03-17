const { Schema, model } = require("mongoose");

const ShareSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    evId: { type: Schema.Types.ObjectId, ref: "EV", required: true },
    sharesPurchased: { type: Number, required: true, min: [1, "Must purchase at least 1 share"] },
    sharePrice: { type: Number, required: true, min: [0.01, "Share price must be positive"] },
  },
  { timestamps: true }
);

// Validate sharePrice and sharesPurchased during creation
ShareSchema.pre("save", async function (next) {
  if (this.isNew) {
    const { EV } = require("./ev.model"); // Avoid circular dependency
    const ev = await EV.findOne({ _id: this.evId, isDeleted: false });
    if (!ev) {
      return next(new Error("EV not found or deleted"));
    }
    if (this.sharePrice !== ev.pricePerShare) {
      return next(new Error("Share price must match EV pricePerShare at purchase time"));
    }
    const availableShares = ev.totalShares - ev.bookedShares;
    if (this.sharesPurchased > availableShares) {
      return next(new Error(`Only ${availableShares} shares available`));
    }
  }
  next();
});

// Stop referral income when shares are removed
ShareSchema.pre("remove", async function (next) {
  const { ReferralEarning } = require("./referralEarning.model");
  try {
    await ReferralEarning.deleteMany({ referredUserId: this.userId, evId: this.evId });
    next();
  } catch (error) {
    next(error);
  }
});

// Indexes for common queries
ShareSchema.index({ userId: 1 });
ShareSchema.index({ evId: 1 });

const Share = model("Share", ShareSchema);

module.exports = { Share };
