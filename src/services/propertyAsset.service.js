const ApiError = require("../errors/ApiErrors");
const PropertyRepository = require("../repositories/property.repository");
const { uploadImageToS3, uploadDocumentToS3, deleteFromS3, getSignedUrlFromS3 } = require("../utils/helpers/aws.util");
const {attachImageUrls}=require("../utils/helpers/files.util")
const { logger } = require("../utils/helpers/logger.util");

class PropertyAssetService {
  static async addImages({ propertyId, files, adminId }) {
    console.log("FILES IN SERVICE:", files);
console.log("FIRST FILE:", files?.[0]);
    const log = logger.child({
      action: "property:addImages",
      propertyId,
      adminId,
    });

    const exists = await PropertyRepository.existsById(propertyId);
    if (!exists) throw new ApiError(404, "Property not found");
    const results = [];

    for (const file of files) {
      try {
        const image = await uploadImageToS3({
          file,
          folderName: `properties/${propertyId}/images`,
        });
        await PropertyRepository.pushImage(propertyId,image);
        const imageWithUrl=await attachImageUrls(image);
        results.push(imageWithUrl);
      } catch (err) {
        log.error("Image upload failed", {
          file: file.originalname,
          error: err.message,
        });
      }
    }


    return {
      uploadedCount: results.length,
      failedCount: files.length - results.length,
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

    const exists = await PropertyRepository.existsById(propertyId);
    if (!exists) throw new ApiError(404, "Property not found");

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const doc = await uploadDocumentToS3({
          file,
          folderName: `properties/${propertyId}/documents`,
        });
        const name=names?.[i] || doc.originalName;
        await PropertyRepository.pushDocument(propertyId,{
          name,
          key:doc.key,
        })
        const url=await getSignedUrlFromS3(doc.key);

        results.push({
          name,
          key:doc.key,
          url,

        });
      
      } catch (err) {
        log.error("Document upload failed", {
          File: file.originalname,
          error: err.message,
        });
      }
    }

    log.info("Documents upload completed", {
      successCount: results.length,
      total: files.length,
    });

    return {
      uploadedCount: results.length,
      failedCount: files.length - results.length,
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

    await PropertyRepository.removeImage(propertyId,imageId);

    if (image.key) {
      await deleteFromS3(image.key);
    }
    
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
     await PropertyRepository.removeDocument(propertyId, documentId);
    if (doc.key) {
      await deleteFromS3(doc.key);
    }

    

    log.info("Property document deleted");
    return { success: true };
  }

  static async updateImage({ propertyId, imageId, file, adminId }) {
    const log = logger.child({ action: "property:updateImage", propertyId, imageId, adminId });
    const property = await PropertyRepository.findById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const image = property.images.id(imageId);
    if (!image) throw new ApiError(404, "Image not found");

    if (image.key) {
      await deleteFromS3(image.key);
    }

    const newImage = await uploadImageToS3({
      file,
      folderName: `properties/${propertyId}/images`,
    });

     image.key = newImage.key;
    image.originalName = newImage.originalName;
    image.mimeType = newImage.mimeType;
    image.size = newImage.size;
    await property.save();

    const imageWithUrl=await attachImageUrls(newImage);


    log.info("Property image updated");
    return { ...newImage,_id: image._id };
  }

  static async updateDocument({ propertyId, documentId, file, name, adminId }) {
    const log = logger.child({ action: "property:updateDocument", propertyId, documentId, adminId });
    const property = await PropertyRepository.findById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const doc = property.documents.id(documentId);
    if (!doc) throw new ApiError(404, "Document not found");
    let url;

    if (file) {
      if (doc.key) {
        await deleteFromS3(doc.key);
      }
      const newDoc = await uploadDocumentToS3({
        file,
        folderName: `properties/${propertyId}/documents`,
      });
  
      doc.key = newDoc.key;
      url=await getSignedUrlFromS3(newDoc.key);
      if (!name) doc.name = newDoc.originalName;
      else 
      {
        url=await getSignedUrlFromS3(doc.key);
      }
    }

    if (name) {
      doc.name = name;
    }

    await property.save();

    log.info("Property document updated");
    return { name: doc.name, key: doc.key, url, _id: doc._id };
  }
}

module.exports = PropertyAssetService;
