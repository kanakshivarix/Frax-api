const router = require("express").Router();
const CafeOutletController = require("../../controllers/cafeOutlet.controller");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const { listCafes } = require("../../validator/cafeoutlet.validator");

router.get("/", validate(listCafes, REQUEST_TARGET.QUERY), CafeOutletController.list);

router.get("/:slug", CafeOutletController.getBySlug);

module.exports = router;
