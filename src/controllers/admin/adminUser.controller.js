const { asyncHandler } = require("../../utils/helpers/asyncHandler.util");
const AdminUserService = require("../../services/admin/adminUser.service");

class AdminUserController {
  static list = asyncHandler(async (req, res) => {
    const result = await AdminUserService.listUsers(req.query);
    return res.sendRes(200, result);
  });
  static getDetails = asyncHandler(async (req, res) => {
    const result = await AdminUserService.getUserDetails(req.params.id);
    return res.sendRes(200, result);
  });
}

module.exports = AdminUserController;
