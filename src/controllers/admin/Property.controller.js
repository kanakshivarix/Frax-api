const PropertyService = require("../../services/property.service");
const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");

class AdminPropertyController {
  static create = asyncHandler(async (req, res) => {
    const property = await PropertyService.createProperty({
      adminId: req.user.userId,
      payload: req.body,
      files: req.files,
    });

    return res.sendRes(201, property, "Property created");
  });

  static list = asyncHandler(async (req, res) => {
    const result = await PropertyService.listAdminProperties(req.query);
    return res.sendRes(200, result, "Admin properties fetched");
  });
  static changeStatus = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { status } = req.body;

    const updatedProperty = await PropertyService.updatePropertyStatus(
      propertyId,
      status,
    );

    return res.sendRes(200, updatedProperty, "Property status updated successfully");
  });
  static update = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    const updated = await PropertyService.updateProperty({
      propertyId,
      updateData: req.body,
      files: req.files,
    });

    return res.sendRes(200, updated, "Property updated successfully");
  });

  static getById = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    const property = await PropertyService.getById(propertyId);

    if (!property) {
      return res.sendRes(404, null, "Property not found");
    }

    return res.sendRes(200, property, "Property fetched successfully");
  });

  static delete = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    await PropertyService.deleteProperty(propertyId);

    return res.sendRes(200, null, "Property and associated files deleted successfully");
  });
}

module.exports = AdminPropertyController;
