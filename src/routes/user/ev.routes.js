const express = require("express");
const EVController = require("../../controllers/ev.controller");
const validate = require("../../middlewares/validate.middleware");
const validation = require("../../validator/ev.validator");

const router = express.Router();

router.get("/", validate(validation.listEVQuerySchema, "query"), EVController.listEVs);

module.exports = router;
