const { Router } = require("express");
const AdminPropertyAssetController = require("../../controllers/admin/PropertyAsset.controller");
const upload = require("../../middlewares/upload.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const allowed = require("../../middlewares/allowed.middleware");
const { User_Type } = require("../../constants/app.constant");

const router = Router();

// Max 10 images at once
router.post(
  "/:propertyId/images",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  upload.array("images", 10),
  AdminPropertyAssetController.uploadImages
);

// Max 10 documents at once
router.post(
  "/:propertyId/documents",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  upload.array("documents", 10),
  AdminPropertyAssetController.uploadDocuments
);

router.delete("/:propertyId/images/:imageId", authMiddleware, allowed(User_Type.SUPER_ADMIN), AdminPropertyAssetController.deleteImage);
router.delete("/:propertyId/documents/:documentId", authMiddleware, allowed(User_Type.SUPER_ADMIN), AdminPropertyAssetController.deleteDocument);
router.patch(
  "/:propertyId/images/:imageId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  upload.array("images", 10),
  AdminPropertyAssetController.updateImage
);

router.patch(
  "/:propertyId/documents/:documentId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  upload.array("documents", 10),
  AdminPropertyAssetController.updateDocument
);

module.exports = router;
