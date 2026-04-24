const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const ReferralController = require("../../controllers/referral.controller");
const router = express.Router();

router.get("/my-link", authMiddleware, ReferralController.getReferralLink);

router.get("/my-earnings", authMiddleware, ReferralController.getPeriodEarnings);

//router.get("/all-earnings", authMiddleware, ReferralController.getTotalEarningsTillToday);

router.get('/my-network',authMiddleware,ReferralController.getReferralHistory)

module.exports = router;
