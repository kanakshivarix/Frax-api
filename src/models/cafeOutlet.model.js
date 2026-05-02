const { model, Schema } = require("mongoose");
const slugify = require("slugify");
const baseTransform = require("./plugins/transform.plugin");

const ImageSchema = require("./schema/image.schema");
const { User, CafeOutlet } = require("../constants/model.constants");

const CAFE_OUTLET_STATUSES = [
  "DRAFT", // Admin preparing - not visible
  "REVIEW", // Waiting for internal/legal review
  "LIVE", // Publicly visible + accepting investments
  "FULLY_FUNDED", // 100% → trigger SPV creation
  "SPV_IN_PROCESS", // Company formation in progress
  "SPV_REGISTERED", // CIN/DIN received, agreements ready
  "LAUNCH_IN_PROGRESS",
  "OPERATIONAL", // Café is open and earning
  "SUSPENDED", // Temporary halt
  "CLOSED", // Permanently shut
  "ARCHIVED", // Historical / failed
];

const cafeOutletSchema = new Schema(
  {
    // Identity & SEO
    outletCode: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    outletName: {
      type: String,
      required: true,
    },

    // Location
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    areaType: { type: String, required: true },
    fullAddress: { type: String, required: true },

    // Financial Structure (protected in service layer)
    totalSetupCost: { type: Number, required: true, immutable: true },
    pricePerShare: { type: Number, required: true, immutable: true },
    totalShares: { type: Number, required: true, immutable: true },
    soldShares: { type: Number, default: 0, min: 0 },
    minInvestmentShares: { type: Number, default: 1, min: 1 },
    maxInvestmentSharesPerUser: { type: Number, default: 500 },
    expectedMonthlyProfit: { type: Number, required: true, min: 0 },
    projectedROI: { type: Number }, // annual %

    // Physical & Operational
    carpetAreaSqFt: { type: Number, min: 100 },
    seatingCapacity: { type: Number, min: 10 },
    parkingAvailability: { type: Boolean, default: false },

    // Marketing & Investor Appeal
    shortDescription: {
      type: String,
    },
    description: {
      type: String,
    },
    highlights: [{ type: String }], // bullet points for cards

    estimatedLaunchDate: { type: Date, required: true },
    actualLaunchDate: { type: Date },

    // Media
    images: {
      type: [ImageSchema],
      default: [],
    },
    menuImages: {
      type: [ImageSchema],
      default: [],
    },
    coverImage: {
      type: ImageSchema,
      default: null,
    },
    brochure: {
      type: ImageSchema,
      default: null,
    },

    // Legal & SPV Tracking
    spvCompanyName: { type: String, sparse: true },
    spvCIN: { type: String, sparse: true },
    spvIncorporationDate: { type: Date },
    spvStatus: {
      type: String,
      enum: ["NOT_STARTED", "IN_PROCESS", "REGISTERED", "FAILED"],
      default: "NOT_STARTED",
    },

    // Lifecycle
    status: {
      type: String,
      enum: CAFE_OUTLET_STATUSES,
      default: "DRAFT",
      required: true,
      index: true,
    },

    // Audit
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtuals (super useful for frontend)
cafeOutletSchema.virtual("remainingShares").get(function () {
  return Math.max(0, this.totalShares - this.soldShares);
});

cafeOutletSchema.virtual("fundingPercentage").get(function () {
  if (this.totalShares <= 0) return 0;
  return Math.min(100, Math.round((this.soldShares / this.totalShares) * 100));
});

cafeOutletSchema.virtual("canInvest").get(function () {
  return this.status === "LIVE" && !this.isFullyFunded;
});

cafeOutletSchema.virtual("isAlmostFull").get(function () {
  if (!this.totalShares) return false;
  return this.fundingPercentage >= 90 && !this.isFullyFunded;
});

cafeOutletSchema.virtual("isFullyFunded").get(function () {
  return this.soldShares >= this.totalShares;
});

// Indexes for fast queries
cafeOutletSchema.index({ status: 1, city: 1 });

cafeOutletSchema.pre("save", function (next) {
  if (!this.slug && this.outletName && this.city) {
    this.slug = slugify(`${this.outletName}-${this.city}-${this.outletCode}`, {
      lower: true,
      strict: true,
    });
  }
  next();
});

cafeOutletSchema.plugin(baseTransform);

module.exports = model(CafeOutlet, cafeOutletSchema);
