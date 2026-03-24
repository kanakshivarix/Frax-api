const ApiError = require("../errors/ApiErrors");
const CafeOutletRepository = require("../repositories/cafeOutlet.repository");
const { uploadImageToS3, uploadDocumentToS3, deleteFromS3 } = require("../utils/helpers/aws.util");
const { logger } = require("../utils/helpers/logger.util");

class CafeOutletImageService {
  static async addGalleryImages({ cafeOutletId, files, adminId }) {
    const log = logger.child({
      action: "cafe:addGalleryImages",
      cafeOutletId,
      adminId,
      count: files.length,
    });

    const cafe = await CafeOutletRepository.existsById(cafeOutletId);
    if (!cafe) throw new ApiError(404, "Cafe outlet not found");

    const uploadedImages = [];

    for (const file of files) {
      try {
        const image = await uploadImageToS3({
          file,
          folderName: `cafes/${cafeOutletId}/images`,
        });

        await CafeOutletRepository.pushImage(cafeOutletId, image);
        uploadedImages.push(image);
      } catch (err) {
        log.error("Image upload failed", {
          originalName: file.originalname,
          error: err.message,
        });
        // IMPORTANT: continue, do NOT abort entire batch
      }
    }

    log.info("Gallery images upload completed", {
      successCount: uploadedImages.length,
      total: files.length,
    });

    return {
      uploadedCount: uploadedImages.length,
      failedCount: files.length - uploadedImages.length,
      uploadedImages,
    };
  }

  static async addMenuImages({ cafeOutletId, files, adminId }) {
    const log = logger.child({
      action: "cafe:addMenuImages",
      cafeOutletId,
      adminId,
      count: files.length,
    });

    // const cafe = await CafeOutletRepository.findById(cafeOutletId);
    // if (!cafe) throw new ApiError(404, "Cafe outlet not found");
    const cafe = await CafeOutletRepository.existsById(cafeOutletId);
    if (!cafe) throw new ApiError(404, "Cafe outlet not found");

    const uploadedImages = [];

    for (const file of files) {
      try {
        const image = await uploadImageToS3({
          file,
          folderName: `cafes/${cafeOutletId}/menu`,
        });

        await CafeOutletRepository.pushMenuImage(cafeOutletId, image);
        uploadedImages.push(image);
      } catch (err) {
        log.error("Image upload failed", {
          originalName: file.originalname,
          error: err.message,
        });
        // IMPORTANT: continue, do NOT abort entire batch
      }
    }

    log.info("Menu images upload completed", {
      successCount: uploadedImages.length,
      total: files.length,
    });

    return {
      uploadedCount: uploadedImages.length,
      failedCount: files.length - uploadedImages.length,
      uploadedImages,
    };
  }

  static async setCoverImage({ cafeOutletId, file, adminId }) {
    const log = logger.child({
      action: "cafe:setCoverImage",
      cafeOutletId,
      adminId,
    });

    const cafe = await CafeOutletRepository.findById(cafeOutletId).select("coverImage");
    if (!cafe) throw new ApiError(404, "Cafe outlet not found");

    if (cafe.coverImage?.key) {
      await deleteFromS3(cafe.coverImage.key);
    }

    const image = await uploadImageToS3({
      file,
      folderName: `cafes/${cafeOutletId}/cover`,
    });

    const updated = await CafeOutletRepository.setCoverImage(cafeOutletId, image);
    log.info("Cover image set");

    return updated;
  }

  static async setBrochure({ cafeOutletId, file, adminId }) {
    const log = logger.child({
      action: "cafe:setBrochure",
      cafeOutletId,
      adminId,
    });

    const cafe = await CafeOutletRepository.findById(cafeOutletId).select("brochure");
    if (!cafe) throw new ApiError(404, "Cafe outlet not found");

    if (cafe.brochure?.key) {
      await deleteFromS3(cafe.brochure.key);
    }

    const doc = await uploadDocumentToS3({
     
      file,
      folderName: `cafes/${cafeOutletId}/brochure`,
    });

    const updated = await CafeOutletRepository.setBrochure(cafeOutletId, doc);
    log.info("Brochure uploaded");

    return updated;
  }
}

module.exports = CafeOutletImageService;
