const PropertyService = require("../../services/property.service");
const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");

class AdminPropertyController {
  static createProperty = asyncHandler(async (req, res) => {
    const adminId = req.user.userId;
    console.log("USER:", req.user);
    const data = await PropertyService.createProperty(req.body, adminId);
    return res.sendRes(201, data, "Property created successfully");
  });

  static updateProperty = asyncHandler(async (req, res) => {
    const adminId = req.user.userId;
    const { propertyId } = req.params;
    const data = await PropertyService.updateProperty(propertyId, req.body, adminId);
    return res.sendRes(200, data, "Property updated successfully");
  });

  static getAdminProperties = asyncHandler(async (req, res) => {
    const data = await PropertyService.getAdminProperties(req.query);
    return res.sendRes(200, data, "Properties retrieved successfully");
  });

  static getPropertyById = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const data = await PropertyService.getPropertyById(propertyId);
    return res.sendRes(200, data, "Property retrieved successfully");
  });

  static deleteProperty = asyncHandler(async (req, res) => {
    const adminId = req.user.userId;
    const { propertyId } = req.params;
    await PropertyService.deleteProperty(propertyId, adminId);
    return res.sendRes(200, null, "Property deleted successfully");
  });
}

module.exports = AdminPropertyController;
