const express = require("express");
const router = express.Router();

const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const validation = require("../../validator/investment.validator");

const InvestmentController = require("../../controllers/investment.controller");
const upload = require("../../middlewares/upload.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");

// USER → create investment (buy shares)
router.post(
  "/",
  authMiddleware,
  upload.fields([{ name: "paymentProof", maxCount: 1 }]),
  validate(validation.createInvestment),
  InvestmentController.createInvestment,
);
/**
 * GET /user/investments
 * Logged-in user's investments (list)
 */
router.get(
  "/",
  authMiddleware,
  validate(validation.listMyInvestments, REQUEST_TARGET.QUERY),
  InvestmentController.listMine,
);

/**
 * GET /user/investments/:investmentId
 * Logged-in user's single investment
 */
router.get(
  "/:investmentId",
  authMiddleware,
  validate(validation.getMyInvestment, REQUEST_TARGET.PARAMS),
  InvestmentController.getMineById,
);

module.exports = router;
