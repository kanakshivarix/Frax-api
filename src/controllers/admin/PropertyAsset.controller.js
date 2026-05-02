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

  static updateImage = asyncHandler(async (req, res) => {
    const { propertyId, imageId } = req.params;
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    const adminId = req.user.userId;

    if (!file) return res.sendRes(400, null, "Image file is required for update");

    const data = await PropertyAssetService.updateImage({ propertyId, imageId, file, adminId });
    return res.sendRes(200, data, "Image updated successfully");
  });

  static updateDocument = asyncHandler(async (req, res) => {
    const { propertyId, documentId } = req.params;
    const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
    const { name } = req.body;
    const adminId = req.user.userId;

    const data = await PropertyAssetService.updateDocument({ propertyId, documentId, file, name, adminId });
    return res.sendRes(200, data, "Document updated successfully");
  });
}

module.exports = AdminPropertyAssetController;
