const { Schema, model } = require("mongoose");
const ImageSchema = require("./schema/image.schema");
const {
  User,
  Property,
  Investment,
} = require("../constants/model.constants");
const { Payment_Method } = require("../constants/app.constant");
const baseTransform = require("./plugins/transform.plugin");

const INVESTMENT_STATUS = [
  "PAYMENT_UPLOADED",
  "ADMIN_APPROVED",
  "ADMIN_REJECTED",
];

const InvestmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: Property,
      required: true,
      index: true,
    },

    shares: { type: Number, required: true, min: 1 },
    pricePerShare: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    investmentRef: { type: String, required: true, unique: true, index: true },

    payment: {
      method: {
        type: String,
        enum: Object.values(Payment_Method),
        default: Payment_Method.BANK_TRANSFER,
      },
      utr: { type: String, required: true },
      paidAt: { type: Date, required: true },
      proof: { type: ImageSchema, required: true },
    },
    invoice: {
      invoiceNumber: { type: String, unique: true, sparse: true },

      file: {
        key: { type: String }, 
        originalName: { type: String }, 
        mimeType: { type: String }, 
        size: { type: Number },
        checksum: { type: String },
      },

      generatedAt: { type: Date },
    },

    status: {
      type: String,
      enum: INVESTMENT_STATUS,
      default: "PAYMENT_UPLOADED",
      index: true,
    },

    rejectionReason: { type: String, default: null },

    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: User },
  },
  { timestamps: true },
);

InvestmentSchema.plugin(baseTransform);

module.exports = model(Investment, InvestmentSchema);
