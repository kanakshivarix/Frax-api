const express = require("express");
const { constants } = require("../../utils/constants/history.constant");
const validate = require("../../middlewares/validate.middleware");
const validation = require("../../validator/ev.validator");
const EVController = require("../../controllers/ev.controller");
const { requirePermission } = require("../../middlewares/permission.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { uploadImages } = require("../../middlewares/upload.middleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requirePermission([{ module: constants.Modules.ADMIN, action: constants.Actions.CREATE }]),
  uploadImages("images", 10),
  validate(validation.EVSchemaCreate),
  EVController.createEV
);

router.post(
  "/:evId",
  authMiddleware,
  requirePermission([{ module: constants.Modules.ADMIN, action: constants.Actions.UPDATE }]),
  validate(validation.EVSchemaUpdate),
  EVController.updateEV
);

router.delete(
  "/:evId",
  authMiddleware,
  requirePermission([{ module: constants.Modules.ADMIN, action: constants.Actions.DELETE }]),
  validate(validation.EVSchemaDelete, "params"),
  EVController.deleteEV
);

module.exports = router;
