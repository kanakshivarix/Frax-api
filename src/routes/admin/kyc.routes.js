const express = require("express");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const validation = require("../../validator/kyc.validator");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const AdminKycController = require("../../controllers/admin/kyc.controller");
const { User_Type } = require("../../constants/app.constant");
const allowed = require("../../middlewares/allowed.middleware");

const router = express.Router();

// LIST with filter + search + pagination
router.get(
  "/",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.list, REQUEST_TARGET.QUERY),
  AdminKycController.listKycs,
);

// SINGLE KYC
router.get(
  "/:userId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.getOne, REQUEST_TARGET.PARAMS),
  AdminKycController.getSingleKyc,
);
/**
 * Admin KYC verification / rejection
 */
router.post(
  "/update",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.updateKycStepSchema),
  AdminKycController.updateStep,
);

router.get(
  "/document/:imageId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminKycController.getKycDocument,
);

module.exports = router;
