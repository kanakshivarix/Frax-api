const { Share } = require("../../models/share.model");

class AdminShareService {
  static async listShares({ userId, evId, page, limit }) {
    const filter = {};
    if (userId) filter.userId = userId;
    if (evId) filter.evId = evId;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      Share.find(filter)
        .populate("userId", "firstName lastName email phone")
        .populate("evId", "model totalShares pricePerShare")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Share.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}

module.exports = AdminShareService;
