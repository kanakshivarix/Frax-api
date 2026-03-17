const router = require("express").Router();
const { User_Type } = require("../../constants/app.constant");
const AdminCafeOutletController = require("../../controllers/admin/CafeOutlet.controller");
const allowed = require("../../middlewares/allowed.middleware");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { validate, REQUEST_TARGET } = require("../../middlewares/validate.middleware");

const validation = require("../../validator/cafeoutlet.validator");

router.get(
  "/",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.listAdminCafes, REQUEST_TARGET.QUERY),
  AdminCafeOutletController.list,
);

router.post(
  "/",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  validate(validation.cafeOutlet),
  AdminCafeOutletController.create,
);

module.exports = router;
