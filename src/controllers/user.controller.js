const { asyncHandler } = require("../utils/helpers/asyncHandler.util");
const UserService = require("../services/user.service");

class UserController {
  static checkUser = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const data = await UserService.checkUser({ userId });

    return res.sendRes(200, data);
  });

  static updateUserDetail = asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const updatedUser = await UserService.updateUserDetail({
      userId,
      updateData: req.body,
    });

    return res.sendRes(200, updatedUser);
  });

  static changePassword = asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    await UserService.changePassword({
      userId,
      currentPassword,
      newPassword,
    });

    return res.sendRes(200, null, "Password updated successfully");
  });
}

module.exports = UserController;
