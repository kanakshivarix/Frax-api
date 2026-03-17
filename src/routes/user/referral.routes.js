const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const ReferralController = require("../../controllers/referral.controller");
const router = express.Router();

router.get("/link", authMiddleware, ReferralController.getReferralLink);

router.get("/earnings", authMiddleware, ReferralController.getPeriodEarnings);

router.get("/all-earnings", authMiddleware, ReferralController.getTotalEarningsTillToday);

module.exports = router;
