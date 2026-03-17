const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const ReferralController = require("../../controllers/referral.controller");
const { requirePermission } = require("../../middlewares/permission.middleware");
const { constants } = require("../../utils/constants/history.constant");
const router = express.Router();

router.post(
  "/payout-schedule",
  authMiddleware,
  requirePermission([{ module: constants.Modules.ADMIN, action: constants.Actions.CREATE }]),
  ReferralController.updatePayoutSchedule
);

module.exports = router;
