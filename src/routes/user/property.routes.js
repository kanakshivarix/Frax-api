const router = require("express").Router();
const PropertyController = require("../../controllers/property.controller");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const { listProperties } = require("../../validator/property.validator");

router.get("/", validate(listProperties, REQUEST_TARGET.QUERY), PropertyController.list);

router.get("/:slug", PropertyController.getBySlug);

module.exports = router;
