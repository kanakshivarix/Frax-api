const express = require("express");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");
const validation = require("../../validator/investment.validator");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const AdminInvestmentController = require("../../controllers/admin/adminInvestment.controller");
const { User_Type } = require("../../constants/app.constant");
const allowed = require("../../middlewares/allowed.middleware");

const router = express.Router();

/**
 * Post /admin/investments/:investmentId/approve
 * Approve investment
 */
router.post(
  "/:investmentId/approve",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.approveInvestment, REQUEST_TARGET.PARAMS),
  AdminInvestmentController.approve,
);

/**
 * Post /admin/investments/:investmentId/reject
 * Reject investment
 */
router.post(
  "/:investmentId/reject",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.rejectInvestmentParams, REQUEST_TARGET.PARAMS),
  validate(validation.rejectInvestmentBody, REQUEST_TARGET.BODY),
  AdminInvestmentController.reject,
);

/**
 * GET /admin/investments
 * List investments (paginated, filterable)
 */
router.get(
  "/",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.listInvestments, REQUEST_TARGET.QUERY),
  AdminInvestmentController.list,
);

/**
 * GET /admin/investments/:investmentId
 * Single investment view
 */
router.get(
  "/:investmentId",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.getInvestment, REQUEST_TARGET.PARAMS),
  AdminInvestmentController.getById,
);

module.exports = router;
