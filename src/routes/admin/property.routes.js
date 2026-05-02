const router = require("express").Router();
const { User_Type } = require("../../constants/app.constant");
const AdminPropertyController = require("../../controllers/admin/Property.controller");
const allowed = require("../../middlewares/allowed.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
//const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const { propertyImage } = require("../../validator/property.validator");
const upload = require("../../middlewares/upload.middleware");


const validation = require("../../validator/property.validator");


router.get(
  "/",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.listAdminProperties, REQUEST_TARGET.QUERY),
  AdminPropertyController.list,
);

router.post(
  "/",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.property),
  AdminPropertyController.create,
);
router.patch(
  "/:propertyId/status",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.updateStatus, REQUEST_TARGET.BODY), // validate body { status }
  AdminPropertyController.changeStatus
);
router.patch(
  "/:propertyId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  upload.array("files", 20),
  validate(validation.updateProperty, REQUEST_TARGET.BODY),
   validate(propertyImage, REQUEST_TARGET.PARAMS),
  AdminPropertyController.update
);
router.get(
  "/:propertyId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.getById, REQUEST_TARGET.PARAMS),
  AdminPropertyController.getById
);

router.delete(
  "/:propertyId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.getById, REQUEST_TARGET.PARAMS),
  AdminPropertyController.delete
);

module.exports = router;
