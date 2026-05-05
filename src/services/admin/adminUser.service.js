const { User } = require("../../models/user.model");
const Investment = require("../../models/investment.model");
const { User_Type } = require("../../constants/app.constant");

class AdminUserService {
  static async listUsers(query) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { role: User_Type.USER };
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: "i" } },
        { lastName: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { phone: { $regex: query.search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
    .select("firstName lastName email phone createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(filter);

    const usersWithInvestments = await Promise.all(
      users.map(async (user) => {
        const investments = await Investment.find({
          userId: user._id,
          status: "ADMIN_APPROVED",
        }).lean();
        const totalInvestment = investments.reduce(
          (sum, inv) => sum + (inv.totalAmount || 0),
          0,
        );
        return {
          ...user,
          totalInvestment,
        };
      }),
    );

    return {
      users: usersWithInvestments,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
  static async getUserDetails(userId) {
    const user = await User.findById(userId)
      .select("-password -verificationToken -resetPasswordToken -refreshToken")
      .lean();

    if (!user) {
      throw new Error("User not found");
    }

    const investments = await Investment.find({
      userId: user._id,
      status: "ADMIN_APPROVED",
    })
      .populate("propertyId", "title price location")
      .sort({ createdAt: -1 })
      .lean();

    const totalInvestment = investments.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0,
    );

    return {
      user: {
        ...user,
        totalInvestment,
      },
      investments,
    };
  }
}

module.exports = AdminUserService;
