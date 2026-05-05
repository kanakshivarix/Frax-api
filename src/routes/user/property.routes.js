const { Router } = require("express");
const PropertyController = require("../../controllers/property.controller");
const router = Router();

router.get("/highlighted",PropertyController.getHighlighted);
router.get("/list", PropertyController.getPublicProperties);
router.get("/:propertyId", PropertyController.getPropertyById);


module.exports = router;
