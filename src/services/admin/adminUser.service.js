const { User } = require("../../models/user.model");
const Investment = require("../../models/investment.model");
const { User_Type } = require("../../constants/app.constant");

class AdminUserService {
  static async listUsers(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: User_Type.USER })
      .select("firstName lastName email phone createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments({ role: User_Type.USER });

    const usersWithInvestments = await Promise.all(
      users.map(async (user) => {
        const investments = await Investment.find({ userId: user._id, status: "ADMIN_APPROVED" }).lean();
        const totalInvestment = investments.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
        return {
          ...user,
          totalInvestment
        };
      })
    );

    return {
      users: usersWithInvestments,
      totalCount,
      page,
      limit,
    };
  }
  static async getUserDetails(userId) {
    const user = await User.findById(userId)
      .select("-password -verificationToken -resetPasswordToken -refreshToken")
      .lean();

    if (!user) {
      throw new Error("User not found");
    }

    const investments = await Investment.find({ userId: user._id, status: "ADMIN_APPROVED" })
      .populate("outletId", "outletName outletCode location")
      .sort({ createdAt: -1 })
      .lean();

    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return {
      user: {
        ...user,
        totalInvestment
      },
      investments
    };
  }
}

module.exports = AdminUserService;
