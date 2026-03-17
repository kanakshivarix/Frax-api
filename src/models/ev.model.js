const { default: Decimal } = require("decimal.js");
const { Schema, model } = require("mongoose");

Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

const EVSchema = new Schema(
  {
    model: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    totalShares: { type: Number, default: 0 },
    pricePerShare: { type: Number, required: true },
    bookedShares: { type: Number, default: 0 },
    monthlyIncome: { type: Number, default: 0 },
    expectedMonthlyIncome: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
    images: [{ type: Schema.Types.ObjectId, ref: "ImageEV" }],
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

EVSchema.virtual("remainingShares").get(function () {
  return this.totalShares - this.bookedShares;
});

// Calculate pricePerShare before saving
EVSchema.pre("validate", function (next) {
  if (this.isModified("totalPrice") || this.isModified("totalShares")) {
    if (this.totalShares <= 0) {
      return next(new Error("Total shares must be positive"));
    }
    const totalPrice = new Decimal(this.totalPrice);
    const totalShares = new Decimal(this.totalShares);
    this.pricePerShare = totalPrice.div(totalShares).toFixed(2, Decimal.ROUND_HALF_UP);
  }

  // Validate bookedShares <= totalShares
  if (this.bookedShares > this.totalShares) {
    return next(new Error("Booked shares cannot exceed total shares"));
  }
  next();
});

const EV = model("EV", EVSchema);
module.exports = { EV };
