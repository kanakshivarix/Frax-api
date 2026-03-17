const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const upload = require("../../middlewares/upload.middleware");

const KycController = require("../../controllers/kyc.controller");
const kycValidator = require("../../validator/kyc.validator");

// PAN
router.post(
  "/pan",
  authMiddleware,
  upload.fields([{ name: "front", maxCount: 1 }]),
  // validate(kycValidator.submitPan),
  KycController.submitPan,
);

// Aadhaar
router.post(
  "/aadhaar",
  authMiddleware,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "back", maxCount: 1 },
  ]),
  // validate(kycValidator.submitAadhaar),
  KycController.submitAadhaar,
);

// Bank
router.post(
  "/bank",
  authMiddleware,
  upload.fields([{ name: "proofs", maxCount: 2 }]),
  // validate(kycValidator.submitBank),
  KycController.submitBank,
);

// Address
router.post(
  "/address",
  authMiddleware,
  // validate(kycValidator.submitAddress),
  KycController.submitAddress,
);

// Quick KYC status (lightweight)
router.get("/status", authMiddleware, KycController.getKycStatus);

module.exports = router;
