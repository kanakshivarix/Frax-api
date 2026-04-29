const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const { User_Type } = require("../../constants/app.constant");
const allowed = require("../../middlewares/allowed.middleware");
const AdminUserController = require("../../controllers/admin/adminUser.controller");

const router = express.Router();

router.get(
  "/list",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminUserController.list,
);

router.get(
  "/:id",
  authMiddleware,
  allowed(User_Type.SUPER_ADMIN),
  AdminUserController.getDetails,
);

module.exports = router;
