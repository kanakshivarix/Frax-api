const { Schema, model } = require("mongoose");
const { encryptField, decryptField } = require("../utils/helpers/bcrypt.util");
const { KYC_STATUS } = require("../constants/app.constant");
const ImageSchema = require("./schema/image.schema");
const { User, Kyc } = require("../constants/model.constants");
const baseTransform = require("./plugins/transform.plugin");

const KycSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: User, required: true, unique: true, index: true },

    pan: {
      number: { type: String, trim: true, select: false },
      front: ImageSchema, // PAN has only one side
      status: {
        type: String,
        enum: Object.values(KYC_STATUS),
        default: KYC_STATUS.NOT_SUBMITTED,
      },
      rejectionReason: { type: String, default: null },
      verifiedAt: { type: Date },
    },

    aadhaar: {
      number: { type: String, trim: true, select: false },
      front: ImageSchema,
      back: ImageSchema,
      status: {
        type: String,
        enum: Object.values(KYC_STATUS),
        default: KYC_STATUS.NOT_SUBMITTED,
      },
      rejectionReason: { type: String, default: null },
      verifiedAt: { type: Date },
    },

    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, default: "India", trim: true },
    },

    bankDetails: {
      accountNumber: { type: String, trim: true, select: false },
      ifscCode: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
      rejectionReason: { type: String, default: null },
      status: {
        type: String,
        enum: Object.values(KYC_STATUS),
        default: KYC_STATUS.NOT_SUBMITTED,
      },
      proofs: [ImageSchema], // cancelled cheque / statement
      verifiedAt: { type: Date },
    },

    status: {
      type: String,
      enum: Object.values(KYC_STATUS),
      default: KYC_STATUS.NOT_SUBMITTED,
    },

    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

// Encrypt sensitive fields before saving
KycSchema.pre("save", function (next) {
  if (this.isModified("pan.number") && this.pan?.number) {
    this.pan.number = encryptField(this.pan.number);
  }
  if (this.isModified("aadhaar.number") && this.aadhaar?.number) {
    this.aadhaar.number = encryptField(this.aadhaar.number);
  }
  if (this.isModified("bankDetails.accountNumber") && this.bankDetails?.accountNumber) {
    this.bankDetails.accountNumber = encryptField(this.bankDetails.accountNumber);
  }
  next();
});

// Decrypt after retrieval
const decryptDoc = (doc) => {
  if (doc.pan?.number) doc.pan.number = decryptField(doc.pan.number);
  if (doc.aadhaar?.number) doc.aadhaar.number = decryptField(doc.aadhaar.number);
  if (doc.bankDetails?.accountNumber) {
    doc.bankDetails.accountNumber = decryptField(doc.bankDetails.accountNumber);
  }
};

KycSchema.post("find", function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach(decryptDoc);
  } else if (docs) {
    decryptDoc(docs);
  }
});

KycSchema.post("findOne", function (doc) {
  if (doc) decryptDoc(doc);
});

// Mask in JSON output
KycSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.aadhaar?.number) {
      ret.aadhaar.number = `XXXXXXXX${ret.aadhaar.number.slice(-4)}`;
    }

    if (ret.pan?.number) {
      ret.pan.number = `XXXXX${ret.pan.number.slice(-4)}`;
    }

    if (ret.bankDetails?.accountNumber) {
      ret.bankDetails.accountNumber = `XXXX${ret.bankDetails.accountNumber.slice(-4)}`;
    }
    return ret;
  },
});

KycSchema.plugin(baseTransform);

module.exports = model(Kyc, KycSchema);
