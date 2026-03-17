const { Schema, model } = require("mongoose");

const IncomeDistributionSchema = new Schema(
  {
    evId: { type: Schema.Types.ObjectId, ref: "EV", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    period: { type: String, required: true }, // e.g., "2025-05"
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

IncomeDistributionSchema.index({ evId: 1, userId: 1, period: 1 }, { unique: true });

const IncomeDistribution = model("IncomeDistribution", IncomeDistributionSchema);
module.exports = { IncomeDistribution };
