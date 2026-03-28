const path = require("path");
const crypto = require("crypto");
const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const ApiError = require("../../errors/ApiErrors");
const { generateChecksum } = require("./common.util");
const { AWS_S3_BUCKET_NAME } = require("../../configs/env.config");
const { logger } = require("./logger.util");
const { s3Client } = require("../../configs/aws.config");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

/**
 * Sanitizes a filename for safe use as S3 key
 * @param {string} filename The original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFileName(filename) {
  return filename
    .normalize("NFD") // decompose accents
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-zA-Z0-9._-]/g, "-") // keep letters, numbers, . _ -
    .replace(/-+/g, "-") // collapse dashes
    .replace(/^-+|-+$/g, "") // trim leading/trailing dashes
    .substring(0, 200); // longer but safe limit
}

async function uploadToS3({
  bucket = AWS_S3_BUCKET_NAME,
  key,
  body,
  contentType,
  contentDisposition,
  skipValidation = false,
}) {
  try {
    if (!skipValidation) {
      const { fileTypeFromBuffer } = await import("file-type");
      const detected = await fileTypeFromBuffer(body);

      if (!detected || !ALLOWED_MIME_TYPES.includes(detected.mime)) {
        throw new ApiError(400, "Invalid or unsupported file content");
      }
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
      ...(contentDisposition && { ContentDisposition: contentDisposition }),
    });

    await s3Client.send(command);

    return { key };
  } catch (error) {
    logger.error("S3 upload error:", error);
    throw new ApiError(500, "Failed to upload file to S3");
  }
}

async function uploadImageToS3({ file, folderName }) {
  const { fileTypeFromBuffer } = await import("file-type");

  // 1. Validate ORIGINAL buffer
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !["image/jpeg", "image/png"].includes(detected.mime)) {
    throw new ApiError(400, "Invalid image file. Only JPEG and PNG allowed.");
  }

  // Preserve original format
  const finalMime = detected.mime;
  const finalExt = detected.ext || (finalMime === "image/jpeg" ? "jpg" : "png");

  // Use original extension in filename (sanitized)
  const safeFileName = sanitizeFileName(
    path.basename(file.originalname, path.extname(file.originalname)) + `.${finalExt}`,
  );

  const key = `${folderName}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

  const checksum = generateChecksum(file.buffer);

  // Upload original buffer
  await uploadToS3({
    key,
    body: file.buffer,
    contentType: finalMime,
    skipValidation: true, // already validated
  });

  return {
    key,
    originalName: safeFileName,
    mimeType: finalMime,
    size: file.buffer.length,
    checksum,
  };
}

async function uploadDocumentToS3({ file, folderName }) {
  const { fileTypeFromBuffer } = await import("file-type");

  const detected = await fileTypeFromBuffer(file.buffer);

  if (!detected) {
    throw new ApiError(400, "Could not detect file type");
  }

  const isImage = ["image/jpeg", "image/png"].includes(detected.mime);
  const isPdf = detected.mime === "application/pdf";

  if (!isImage && !isPdf) {
    throw new ApiError(400, "Unsupported file type. Allowed: JPEG, PNG, PDF");
  }

  // Preserve original format
  const finalMime = detected.mime;
  const finalExt = detected.ext || "bin"; // fallback, but file-type usually gives good ext

  const safeFileName = sanitizeFileName(
    path.basename(file.originalname, path.extname(file.originalname)) + `.${finalExt}`,
  );

  const key = `${folderName}/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

  const checksum = generateChecksum(file.buffer);

  // Upload original buffer
  await uploadToS3({
    key,
    body: file.buffer,
    contentType: finalMime,
    skipValidation: true,
  });

  return {
    key,
    originalName: safeFileName,
    mimeType: finalMime,
    size: file.buffer.length,
    checksum,
  };
}

async function getSignedUrlFromS3(s3Key, options = {}) {
  try {
    const { download = false, fileName } = options;

    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: s3Key,
      ...(download && {
        ResponseContentDisposition: `attachment${fileName ? `; filename="${fileName}"` : ""}`,
      }),
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return signedUrl;
  } catch (error) {
    logger.error("S3 signed URL error:", error);
    throw new ApiError(400, `Failed to generate signed URL: ${error.message}`);
  }
}

async function deleteFromS3(s3Key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });
    await s3Client.send(command);
    logger.info("S3 object deleted successfully", {
      bucket: AWS_S3_BUCKET_NAME,
      key: s3Key,
    });
  } catch (error) {
    logger.error("S3 delete error:", error);
    // throw new ApiError(500, `Failed to delete image: ${error.message}`);  //! it's in rollback
  }
}

/**
 * Returns a readable stream from S3 (NON-BLOCKING)
 * This is the fastest + most scalable way to serve PDFs
 */
async function getObjectStreamFromS3(s3Key) {
  try {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      logger.error("S3 returned empty body", { s3Key });
      throw new ApiError(500, "Unable to fetch file");
    }

    // response.Body is a Node.js Readable stream
    return response.Body;
  } catch (error) {
    logger.error("S3 stream error", { s3Key, error });
    throw new ApiError(404, "File not found in storage");
  }
}

module.exports = {
  uploadImageToS3,
  uploadDocumentToS3,
  deleteFromS3,
  getSignedUrlFromS3,
  getObjectStreamFromS3,
};
