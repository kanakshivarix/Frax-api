const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { User_Type } = require("../../constants/app.constant");
const allowed = require("../../middlewares/allowed.middleware");
const AdminReferralController = require("../../controllers/admin/adminReferral.controller");
const {
  requirePermission,
} = require("../../middlewares/permission.middleware");
const { constants } = require("../../utils/constants/history.constant");

const router = express.Router();

router.get(
  "/overview",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminReferralController.overview,
);

router.get(
  "/earnings",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminReferralController.list,
);
router.post(
  "/payout-schedule",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminReferralController.updatePayoutSchedule,
);

router.post(
  "/distribute-profit",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminReferralController.distributeProfit,
);

module.exports = router;
