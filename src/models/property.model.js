const { Schema, model } = require("mongoose");
const { User, Property } = require("../constants/model.constants");
const ImageSchema = require("./schema/image.schema");
const baseTransform = require("./plugins/transform.plugin");

const PROPERTY_STATUSES = ["available", "sold", "pending"];
const PROPERTY_APPROVAL_STATUSES = ["pending", "approved", "rejected"];

const propertySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    pricePerUnit: {
      type: Number,
    },
    area: {
      value: Number, // e.g. 1200
      unit: {
        type: String,
        enum: ["sqft", "acre", "hectare", "sqyd"],
      },
    },
    landType: {
      type: String,
      enum: ["residential", "commercial", "agricultural", "industrial"],
      required: true,
    },
    ownershipType: {
      type: String,
      enum: ["freehold", "leasehold"],
    },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    amenities: [
      {
        type: String,
        enum: ["road_access", "water", "electricity", "drainage", "boundary_wall"],
      },
    ],
    tags: [String],
    images: {
      type: [ImageSchema],
      default: [],
    },
    documents: [
      {
        name: String,
        url: String,
        key: String,
      },
    ],
    ownerDetails: {
      name: String,
      contact: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: PROPERTY_APPROVAL_STATUSES,
      default: "pending",
    },
    status: {
      type: String,
      enum: PROPERTY_STATUSES,
      default: "available",
      index: true,
    },
    listedBy: {
      type: Schema.Types.ObjectId,
      ref: User,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

propertySchema.index({ "location.city": 1, status: 1 });

propertySchema.plugin(baseTransform);

module.exports = model(Property, propertySchema);
