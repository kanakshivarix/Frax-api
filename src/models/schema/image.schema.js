const { Schema } = require("mongoose");
const baseTransform = require("../plugins/transform.plugin");

const ImageSchema = new Schema(
  {
    key: { type: String, required: true }, // S3 key / storage key
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    checksum: { type: String }, // sha256 / md5
  },
  { _id: true, timestamps: true },
);

ImageSchema.plugin(baseTransform);
module.exports = ImageSchema;
