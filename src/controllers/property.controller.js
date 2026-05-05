const PropertyService = require("../services/property.service");
const { asyncHandler } = require("../utils/helpers/asyncHandler.util");

class PropertyController {
  static getPublicProperties = asyncHandler(async (req, res) => {
    const data = await PropertyService.getPublicProperties(req.query);
    return res.sendRes(200, data, "Properties retrieved successfully");
  });

  static getPropertyById = asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const data = await PropertyService.getPropertyById(propertyId);
    return res.sendRes(200, data, "Property retrieved successfully");
  });
  static async getHighlighted(req, res, next) {
  try {
    const property = await PropertyService.getHighlightedProperty();

    res.json({
      success: true,
      data: property,
    });
  } catch (err) {
    next(err);
  }
}
}

module.exports = PropertyController;
