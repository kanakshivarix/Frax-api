const router = require("express").Router();
const upload = require("../../middlewares/upload.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const allowed = require("../../middlewares/allowed.middleware");
const { User_Type } = require("../../constants/app.constant");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const { propertyImage } = require("../../validator/property.validator");
const PropertyImageController = require("../../controllers/admin/PropertyImage.controller");

router.post(
  "/:propertyId/images",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(propertyImage, REQUEST_TARGET.PARAMS),
  upload.array("files", 20),
  PropertyImageController.uploadImages,
);

router.post(
  "/:propertyId/documents",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(propertyImage, REQUEST_TARGET.PARAMS),
  upload.array("files", 10),
  PropertyImageController.uploadDocuments,
);

router.delete(
  "/:propertyId/images/:imageId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  PropertyImageController.deleteImage,
);

router.delete(
  "/:propertyId/documents/:documentId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  PropertyImageController.deleteDocument,
);

module.exports = router;
