const PropertyAssetService = require("../../services/propertyAsset.service");
const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");

class AdminPropertyAssetController {
  static uploadImages = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const adminId = req.user.userId;
    
    if (!req.files || req.files.length === 0) {
      return res.sendRes(400, null, "No files uploaded");
    }

    const data = await PropertyAssetService.addImages({
      propertyId,
      files: req.files,
      adminId,
    });

    return res.sendRes(201, data, "Images uploaded successfully");
  });

  static uploadDocuments = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const adminId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      return res.sendRes(400, null, "No files uploaded");
    }

    let names = [];
    if (req.body.names) {
      names = Array.isArray(req.body.names) ? req.body.names : [req.body.names];
    } else if (req.body.name) {
      names = Array.isArray(req.body.name) ? req.body.name : [req.body.name];
    }

    const data = await PropertyAssetService.addDocuments({
      propertyId,
      files: req.files,
      names,
      adminId,
    });

    return res.sendRes(201, data, "Documents uploaded successfully");
  });

  static deleteImage = asyncHandler(async (req, res) => {
    const { propertyId, imageId } = req.params;
    const adminId = req.user.userId;

    await PropertyAssetService.deleteImage({ propertyId, imageId, adminId });
    return res.sendRes(200, null, "Image deleted successfully");
  });

  static deleteDocument = asyncHandler(async (req, res) => {
    const { propertyId, documentId } = req.params;
    const adminId = req.user.userId;

    await PropertyAssetService.deleteDocument({ propertyId, documentId, adminId });
    return res.sendRes(200, null, "Document deleted successfully");
  });
}

module.exports = AdminPropertyAssetController;
