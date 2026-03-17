const router = require("express").Router();
const upload = require("../../middlewares/upload.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const allowed = require("../../middlewares/allowed.middleware");
const { User_Type } = require("../../constants/app.constant");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const { cafeOutletImage } = require("../../validator/cafeoutlet.validator");
const CafeOutletImageController = require("../../controllers/admin/CafeOutletImage.controller");

router.post(
  "/:cafeOutletId/images",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(cafeOutletImage, REQUEST_TARGET.PARAMS),
  upload.array("files", 10),
  CafeOutletImageController.uploadImage,
);

router.post(
  "/:cafeOutletId/menu-images",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(cafeOutletImage, REQUEST_TARGET.PARAMS),
  upload.array("files", 10),
  CafeOutletImageController.uploadMenuImage,
);

router.post(
  "/:cafeOutletId/cover",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(cafeOutletImage, REQUEST_TARGET.PARAMS),
  upload.single("file"),
  CafeOutletImageController.setCover,
);

router.post(
  "/:cafeOutletId/brochure",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(cafeOutletImage, REQUEST_TARGET.PARAMS),
  upload.single("file"),
  CafeOutletImageController.setBrochure,
);

module.exports = router;
