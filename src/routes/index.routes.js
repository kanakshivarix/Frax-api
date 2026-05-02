const express = require("express");
const router = express.Router();

//admin routes
const adminKycRoute = require("./admin/kyc.routes");
const adminPropertyRoute = require("./admin/property.routes");
const adminPropertyAssetRoute = require("./admin/propertyAsset.routes");
const adminInvestmentRoute = require("./admin/investment.route");
const adminReferralRoute = require("./admin/adminReferral.route");
const adminShareRoute = require("./admin/adminShare.route");
const adminUserRoute = require("./admin/adminUser.route");

// const adminEvRoute = require("./admin/ev.routes");
// const adminReferralEvRoute = require("./admin/referral.routes");

//user routes
const authRoute = require("./user/auth.routes");
const userRoute = require("./user/user.routes");
const userKycRoute = require("./user/kyc.routes");
const propertyRoute = require("./user/property.routes");
const investmentRoute = require("./user/investment.route");

// const evRoute = require("./user/ev.routes");
const referralRoute = require("./user/referral.routes");
// const shareRoute = require("./user/share.routes");
// const userIncome = require("./user/income.routes");

//admin
router.use("/admin/kyc", adminKycRoute);
router.use("/admin/property", adminPropertyRoute);
router.use("/admin/propertyAsset", adminPropertyAssetRoute);
router.use("/admin/investment", adminInvestmentRoute);
router.use("/admin/referral", adminReferralRoute);
// router.use("/admin/share", adminShareRoute);
router.use("/admin/user", adminUserRoute);

// router.use("/admin/ev", adminEvRoute);
// router.use("/admin/referral", adminReferralEvRoute);

//user
router.use("/auth", authRoute);
router.use("/user", userRoute);
router.use("/kyc", userKycRoute);
router.use("/property", propertyRoute);

router.use("/investment", investmentRoute);

// router.use("/ev", evRoute);
router.use("/referral", referralRoute);
// router.use("/share", shareRoute);
 //router.use("/income", userIncome);

module.exports = router;
