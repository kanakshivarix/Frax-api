const PropertyService = require("../services/property.service");
const { asyncHandler } = require("../utils/helpers/asyncHandler.util");

class PropertyController {
  static list = asyncHandler(async (req, res) => {
    const properties = await PropertyService.listProperties(req.query);
    return res.sendRes(200, properties);
  });

  static getBySlug = asyncHandler(async (req, res) => {
    const property = await PropertyService.getPropertyBySlug(req.params.slug);
    return res.sendRes(200, property);
  });
}

module.exports = PropertyController;
