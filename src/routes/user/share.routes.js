const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const ShareController = require("../../controllers/share.controller");
const validate = require("../../middlewares/validate.middleware");
const validation = require("../../validator/share.validator");

const router = express.Router();

router.post("/buy", authMiddleware, validate(validation.ShareSchemaBuy), ShareController.buyShares);

router.get("/ownership-status", authMiddleware, ShareController.getOwnershipStatus);

module.exports = router;
