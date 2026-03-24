const { CafeOutlet } = require("../models/index.model");

class CafeOutletRepository {
  static create(data) {
    return CafeOutlet.create(data);
  }

  static findPublicList(filters = {}) {
    return CafeOutlet.aggregate([
      {
        $match: {
          status: {
            $in: ["LIVE", "FULLY_FUNDED", "SPV_IN_PROCESS", "OPERATIONAL"],
          },
          ...filters,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          id: "$_id",
          _id: 0,

          outletName: 1,
          outletCode: 1,
          city: 1,
          state: 1,
          areaType: 1,
          pricePerShare: 1,
          totalShares: 1,
          soldShares: 1,
          status: 1,
          coverImage: 1,
          createdAt: 1,

          fundingPercentage: {
            $cond: [
              { $gt: ["$totalShares", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$soldShares", "$totalShares"] },
                      100,
                    ],
                  },
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);
  }

  static findBySlug(slug) {
    return CafeOutlet.findOne({ slug });
  }

  static existsById(id) {
    return CafeOutlet.exists({ _id: id });
  }

  static findById(id, session = null) {
    const q = CafeOutlet.findById(id);
    return session ? q.session(session) : q;
  }

  static pushImage(id, image) {
    return CafeOutlet.findByIdAndUpdate(
      id,
      { $push: { images: image } },
      { new: true },
    );
  }

  static pushMenuImage(id, image) {
    return CafeOutlet.findByIdAndUpdate(
      id,
      { $push: { menuImages: image } },
      { new: true },
    );
  }

  static setCoverImage(id, image) {
    return CafeOutlet.findByIdAndUpdate(
      id,
      { coverImage: image },
      { new: true },
    );
  }

  static setBrochure(id, doc) {
    return CafeOutlet.findByIdAndUpdate(id, { brochure: doc }, { new: true });
  }
  static async findPublicPaginated(filter, skip, limit) {
    const pipeline = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: "$_id",
          _id: 0,

          outletName: 1,
          outletCode: 1,
          city: 1,
          state: 1,
          areaType: 1,
          totalSetupCost: 1,
          pricePerShare: 1,
          totalShares: 1,
          soldShares: 1,
          minInvestmentShares: 1,
          maxInvestmentSharesPerUser: 1,
          expectedMonthlyProfit: 1,
          projectedROI: 1,
          carpetAreaSqFt: 1,
          seatingCapacity: 1,
          parkingAvailability: 1,

          shortDescription: 1,
          description: 1,
          highlights: 1,
          estimatedLaunchDate: 1,
          actualLaunchDate: 1,

          // ✅ LIMIT IMAGES TO 5
          images: { $slice: ["$images", 5] },

          // ✅ LIMIT MENU IMAGES TO 5
          menuImages: { $slice: ["$menuImages", 5] },

          coverImage: 1,
          brochure: 1,

          status: 1,
          coverImage: 1,
          createdAt: 1,

          remainingShares: {
            $max: [{ $subtract: ["$totalShares", "$soldShares"] }, 0],
          },
        },
      },
    ];

    return CafeOutlet.aggregate(pipeline);
  }

  static async findAdminPaginated(filter, skip, limit) {
    return CafeOutlet.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: "$_id",
          _id: 0,
          
          outletName: 1,
          outletCode: 1,
          city: 1,
          state: 1,
          areaType: 1,
          totalSetupCost: 1,
          pricePerShare: 1,
          totalShares: 1,
          soldShares: 1,
          minInvestmentShares: 1,
          maxInvestmentSharesPerUser: 1,
          expectedMonthlyProfit: 1,
          projectedROI: 1,
          carpetAreaSqFt: 1,
          seatingCapacity: 1,
          parkingAvailability: 1,

          shortDescription: 1,
          description: 1,
          highlights: 1,
          estimatedLaunchDate: 1,
          actualLaunchDate: 1,

          // ✅ LIMIT IMAGES TO 5
          images: { $slice: ["$images", 5] },

          // ✅ LIMIT MENU IMAGES TO 5
          menuImages: { $slice: ["$menuImages", 5] },

          coverImage: 1,
          brochure: 1,
          status: 1,
          coverImage: 1,
          createdAt: 1,
        },
      },
    ]);
  }

  static count(filter) {
    return CafeOutlet.countDocuments(filter);
  }

  static findLiveOutlet(id, session = null) {
    const q = CafeOutlet.findOne({ _id: id, status: "LIVE" });
    return session ? q.session(session) : q;
  }

  static reserveShares(outletId, shares, session) {
    return CafeOutlet.updateOne(
      {
        _id: outletId,
        status: "LIVE",
        $expr: {
          $lte: ["$soldShares", { $subtract: ["$totalShares", shares] }],
        },
      },
      { $inc: { soldShares: shares } },
      { session },
    );
  }

  static async releaseShares(outletId, shares, session) {
    const result = await CafeOutlet.updateOne(
      {
        _id: outletId,
        soldShares: { $gte: shares },
      },
      { $inc: { soldShares: -shares } },
      { session },
    );

    return result;
  }

  static setStatusToFullyFunded(outletId, session) {
    return CafeOutlet.updateOne(
      {
        _id: outletId,
        status: "LIVE",
        $expr: { $gte: ["$soldShares", "$totalShares"] },
      },
      { $set: { status: "FULLY_FUNDED" } },
      { session },
    );
  }
  static async updateById(cafeId, updateObj) {
    return CafeOutlet.findByIdAndUpdate(cafeId, updateObj, { new: true });
  }
  
}

module.exports = CafeOutletRepository;
