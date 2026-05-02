const { model, Schema } = require("mongoose");
const { Property, User } = require("../constants/model.constants");
const baseTransform = require("./plugins/transform.plugin");
const ImageSchema = require("./schema/image.schema");

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

    images: [ImageSchema],

    documents: [
      {
        name: String,
        url: String,
      },
    ],
    
    tags: [String],

    isVerified: {
      type: Boolean,
      default: false,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    listedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: User,
      },
      name: String,
      contact: String,
    },

    ownerDetails: {
      name: {
        type: String,
      },
      contact: {
        type: String,
      },
    },

    status: {
      type: String,
      enum: ["available", "sold", "pending"],
      default: "available",
    },
  },
  { timestamps: true }
);

propertySchema.plugin(baseTransform);

module.exports = model(Property, propertySchema);
