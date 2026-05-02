const ApiError = require("../errors/ApiErrors");
const PropertyRepository = require("../repositories/property.repository");
const {
  uploadImageToS3,
  uploadDocumentToS3,
  deleteFromS3,
  getPublicUrlFromS3,
  getSignedUrlFromS3,
} = require("../utils/helpers/aws.util");
const { logger } = require("../utils/helpers/logger.util");

class PropertyImageService {
  static async addImages({ propertyId, files, adminId }) {
    const log = logger.child({
      action: "property:addImages",
      propertyId,
      adminId,
      count: files.length,
    });

    const property = await PropertyRepository.existsById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const uploadedImages = [];

    for (const file of files) {
      try {
        const image = await uploadImageToS3({
          file,
          folderName: `properties/${propertyId}/images`,
        });
        const signedUrl = await getSignedUrlFromS3(image.key);

        const imageObj = {
          ...image,
        };

        await PropertyRepository.pushImage(propertyId, imageObj);
        uploadedImages.push(imageObj);
      } catch (err) {
        log.error("Image upload failed", {
          originalName: file.originalname,
          error: err.message,
        });
        throw new ApiError(400,err.message);
      }
    }

    log.info("Images upload completed", {
      successCount: uploadedImages.length,
      total: files.length,
    });

    return {
      uploadedCount: uploadedImages.length,
      failedCount: files.length - uploadedImages.length,
      uploadedImages,
    };
  }

  static async addDocuments({ propertyId, files, names, adminId }) {
    const log = logger.child({
      action: "property:addDocuments",
      propertyId,
      adminId,
      count: files.length,
    });

    const property = await PropertyRepository.existsById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const uploadedDocs = [];

    // Ensure names is an array to easily match with files by index
    let nameArray = [];
    if (names) {
      nameArray = Array.isArray(names) ? names : [names];
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const customName = nameArray[i];
      try {
        const doc = await uploadDocumentToS3({
          file,
          folderName: `properties/${propertyId}/documents`,
        });

        // Use custom name if provided, otherwise fallback to originalname
        const finalName = customName || file.originalname;
        const signedUrl = await getSignedUrlFromS3(doc.key);

        const docObj = {
          name: finalName,
          key: doc.key,
        };
        await PropertyRepository.pushDocument(propertyId, docObj);
        uploadedDocs.push(docObj);
      } catch (err) {
        log.error("Document upload failed", {
          originalName: file.originalname,
          error: err.message,
        });
      }
    }

    log.info("Documents upload completed", {
      successCount: uploadedDocs.length,
      total: files.length,
    });

    return {
      uploadedCount: uploadedDocs.length,
      failedCount: files.length - uploadedDocs.length,
      uploadedDocs,
    };
  }

  static async deleteImage({ propertyId, imageId, adminId }) {
    const log = logger.child({
      action: "property:deleteImage",
      propertyId,
      imageId,
      adminId,
    });

    const property = await PropertyRepository.findById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const image = property.images.id(imageId);
    if (!image) throw new ApiError(404, "Image not found");

    if (image.key) {
      await deleteFromS3(image.key);
    }

    property.images.pull(imageId);
    await property.save();

    log.info("Image deleted");
    return property;
  }

  static async deleteDocument({ propertyId, documentId, adminId }) {
    const log = logger.child({
      action: "property:deleteDocument",
      propertyId,
      documentId,
      adminId,
    });

    const property = await PropertyRepository.findById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    // Since document is inline schema without _id we might need to delete by URL
    // Wait, Mongoose gives _id to subdocuments by default even if inline!
    const doc = property.documents.id(documentId);
    if (!doc) throw new ApiError(404, "Document not found");

    // We didn't store key for documents so we can't easily delete from S3 unless we extract from URL.
    // For now just remove from DB.
    property.documents.pull(documentId);
    await property.save();

    log.info("Document deleted");
    return property;
  }
}

module.exports = PropertyImageService;
