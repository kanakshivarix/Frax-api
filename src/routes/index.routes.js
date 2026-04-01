const express = require("express");
const router = express.Router();

//admin routes
const adminKycRoute = require("./admin/kyc.routes");
const adminCafeRoute = require("./admin/cafeOutlet.routes");
const adminCafeImageRoute = require("./admin/cafeOutletImage.routes");
const adminInvestmentRoute = require("./admin/investment.route");

// const adminEvRoute = require("./admin/ev.routes");
// const adminReferralEvRoute = require("./admin/referral.routes");

//user routes
const authRoute = require("./user/auth.routes");
const userRoute = require("./user/user.routes");
const userKycRoute = require("./user/kyc.routes");
const cafeRoute = require("./user/cafeOutlet.routes");
const investmentRoute = require("./user/investment.route");

// const evRoute = require("./user/ev.routes");
 const referralRoute = require("./user/referral.routes");
// const shareRoute = require("./user/share.routes");
// const userIncome = require("./user/income.routes");

//admin
router.use("/admin/kyc", adminKycRoute);
router.use("/admin/cafe", adminCafeRoute);
router.use("/admin/cafeupload", adminCafeImageRoute);
router.use("/admin/investment", adminInvestmentRoute);

// router.use("/admin/ev", adminEvRoute);
// router.use("/admin/referral", adminReferralEvRoute);

//user
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/kyc", userKycRoute);
router.use("/cafe", cafeRoute);
router.use("/investment", investmentRoute);

// router.use("/ev", evRoute);
 router.use("/referral", referralRoute);
// router.use("/share", shareRoute);
// router.use("/income", userIncome);

module.exports = router;
