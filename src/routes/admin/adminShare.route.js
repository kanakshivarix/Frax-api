const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { User_Type } = require("../../constants/app.constant");
const allowed = require("../../middlewares/allowed.middleware");
const AdminShareController = require("../../controllers/admin/adminShare.controller");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminShareController.list,
);

module.exports = router;
