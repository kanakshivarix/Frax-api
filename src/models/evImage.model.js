const { Schema, model } = require("mongoose");

const ImageEVSchema = new Schema(
  {
    ev: { type: Schema.Types.ObjectId, ref: "EV" },
    url: { type: String, required: true }, // Public S3 URL
    fileName: { type: String }, // S3 key (unique)
    originalName: { type: String }, // Original file name (e.g., image.jpg)
  },
  { timestamps: true }
);

const ImageEV = model("ImageEV", ImageEVSchema);

module.exports = { ImageEV };
