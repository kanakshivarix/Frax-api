const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");
const ApiError = require("../../errors/ApiErrors");
const CafeOutletImageService = require("../../services/cafeOutletImage.service");

class CafeOutletImageController {
  static uploadImage = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "At least one image is required");
    }
    console.log(req.files, "file upload");

    const data = await CafeOutletImageService.addGalleryImages({
      cafeOutletId: req.params.cafeOutletId,
      files: req.files,
      adminId: req.user.userId,
    });

    return res.sendRes(200, data, "Image uploaded");
  });

  static uploadMenuImage = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ApiError(400, "At least one image is required");
    }

    const data = await CafeOutletImageService.addMenuImages({
      cafeOutletId: req.params.cafeOutletId,
      files: req.files,
      adminId: req.user.userId,
    });

    return res.sendRes(200, data, "Image uploaded");
  });

  static setCover = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Cover image is required");

    const data = await CafeOutletImageService.setCoverImage({
      cafeOutletId: req.params.cafeOutletId,
      file: req.file,
      adminId: req.user.userId,
    });

    return res.sendRes(200, data, "Cover image updated");
  });

  static setBrochure = asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "Brochure file is required");
    console.log("reg file:",req.file)

    const data = await CafeOutletImageService.setBrochure({
      cafeOutletId: req.params.cafeOutletId,
      file: req.file,
      adminId: req.user.userId,
    });

    return res.sendRes(200, data, "Brochure uploaded");
  });

  static deleteGalleryImage = asyncHandler(async (req, res) => {
    const data = await CafeOutletImageService.deleteGalleryImage({
      cafeOutletId: req.params.cafeOutletId,
      imageId: req.params.imageId,
      adminId: req.user.userId,
    });
    return res.sendRes(200, data, "Gallery image deleted");
  });

  static deleteMenuImage = asyncHandler(async (req, res) => {
    const data = await CafeOutletImageService.deleteMenuImage({
      cafeOutletId: req.params.cafeOutletId,
      imageId: req.params.imageId,
      adminId: req.user.userId,
    });
    return res.sendRes(200, data, "Menu image deleted");
  });
}

module.exports = CafeOutletImageController;
