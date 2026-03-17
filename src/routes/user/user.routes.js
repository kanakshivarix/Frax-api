const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const UserController = require("../../controllers/user.controller");
const { validate } = require("../../middlewares/validate.middleware");
const validation = require("../../validator/user.validator");

const router = express.Router();

router.route("/details").get(authMiddleware, UserController.checkUser);

router
  .route("/details")
  .patch(authMiddleware, validate(validation.updateProfile), UserController.updateUserDetail);

router
  .route("/change-password")
  .patch(
    authMiddleware,
    validate(validation.UserSchemaChangePassword),
    UserController.changePassword,
  );

module.exports = router;
