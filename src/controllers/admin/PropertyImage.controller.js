const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");
const ApiError = require("../../errors/ApiErrors");
const PropertyImageService = require("../../services/propertyImage.service");

class PropertyImageController {
  static uploadImages = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "At least one image is required");
    }

    const data = await PropertyImageService.addImages({
      propertyId: req.params.propertyId,
      files: req.files,
      adminId: req.user.userId,
    });

    return res.sendRes(200, data, "Images uploaded");
  });

  static uploadDocuments = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "At least one document is required");
    }

    const data = await PropertyImageService.addDocuments({
      propertyId: req.params.propertyId,
      files: req.files,
      names: req.body.names || req.body.name, // Can be array or string depending on form-data
      adminId: req.user.userId,
    });

    return res.sendRes(200, data, "Documents uploaded");
  });

  static deleteImage = asyncHandler(async (req, res) => {
    const data = await PropertyImageService.deleteImage({
      propertyId: req.params.propertyId,
      imageId: req.params.imageId,
      adminId: req.user.userId,
    });
    return res.sendRes(200, data, "Image deleted");
  });

  static deleteDocument = asyncHandler(async (req, res) => {
    const data = await PropertyImageService.deleteDocument({
      propertyId: req.params.propertyId,
      documentId: req.params.documentId,
      adminId: req.user.userId,
    });
    return res.sendRes(200, data, "Document deleted");
  });
}

module.exports = PropertyImageController;
