const ApiError = require("../errors/ApiErrors");
const PropertyRepository = require("../repositories/property.repository");
const { uploadImageToS3, uploadDocumentToS3, deleteFromS3, getSignedUrlFromS3 } = require("../utils/helpers/aws.util");
const { logger } = require("../utils/helpers/logger.util");

class PropertyAssetService {
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
    const results = [];

    for (const file of files) {
      try {
        const image = await uploadImageToS3({
          file,
          folderName: `properties/${propertyId}/images`,
        });

        const updatedImage = await PropertyRepository.pushImage(propertyId, image);
        const signedUrl = await getSignedUrlFromS3(image.key);
        
        results.push({ ...image, url: signedUrl });
        uploadedImages.push(image);
      } catch (err) {
        log.error("Image upload failed", {
          originalName: file.originalname,
          error: err.message,
        });
      }
    }

    log.info("Images upload completed", {
      successCount: uploadedImages.length,
      total: files.length,
    });

    return {
      uploadedCount: uploadedImages.length,
      failedCount: files.length - uploadedImages.length,
      images: results,
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
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const doc = await uploadDocumentToS3({
          file,
          folderName: `properties/${propertyId}/documents`,
        });

        const docName = (names && names[i]) ? names[i] : doc.originalName;
        const signedUrl = await getSignedUrlFromS3(doc.key);
        const newDoc = {
          name: docName,
          key: doc.key,
          url: signedUrl
        };

        await PropertyRepository.pushDocument(propertyId, newDoc);
        results.push(newDoc);
        uploadedDocs.push(newDoc);
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
      documents: results,
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

    await PropertyRepository.removeImage(propertyId, imageId);

    log.info("Property image deleted");
    return { success: true };
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

    const doc = property.documents.id(documentId);
    if (!doc) throw new ApiError(404, "Document not found");

    if (doc.key) {
      await deleteFromS3(doc.key);
    }

    await PropertyRepository.removeDocument(propertyId, documentId);

    log.info("Property document deleted");
    return { success: true };
  }
}

module.exports = PropertyAssetService;
