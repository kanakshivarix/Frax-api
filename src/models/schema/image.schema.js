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

ImageSchema.virtual("url").get(function () {
  if (!this.key) return null;
  const { AWS_REGION, AWS_S3_BUCKET_NAME } = require("../../configs/env.config");
  return `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${this.key}`;
});

ImageSchema.plugin(baseTransform);
module.exports = ImageSchema;
