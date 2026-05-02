const { Router } = require("express");
const AdminPropertyController = require("../../controllers/admin/Property.controller");
const { validate } = require("../../middlewares/validate.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const allowed = require("../../middlewares/allowed.middleware");
const { User_Type } = require("../../constants/app.constant");
const { createPropertySchema, updatePropertySchema } = require("../../validator/property.validator");
const router = Router();

router.post("/", authMiddleware, allowed(User_Type.SUPER_ADMIN), validate(createPropertySchema), AdminPropertyController.createProperty);
router.patch("/:propertyId", authMiddleware, allowed(User_Type.SUPER_ADMIN), validate(updatePropertySchema), AdminPropertyController.updateProperty);
router.get("/list", authMiddleware, allowed(User_Type.SUPER_ADMIN), AdminPropertyController.getAdminProperties);
router.get("/:propertyId", authMiddleware, allowed(User_Type.SUPER_ADMIN), AdminPropertyController.getPropertyById);
router.delete("/:propertyId", authMiddleware, allowed(User_Type.SUPER_ADMIN), AdminPropertyController.deleteProperty);

module.exports = router;
