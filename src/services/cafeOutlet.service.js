const ApiError = require("../errors/ApiErrors");
const CafeOutletRepository = require("../repositories/cafeOutlet.repository");
const { logger } = require("../utils/helpers/logger.util");

class CafeOutletService {
  static async createCafe({ adminId, payload }) {
    const log = logger.child({
      action: "createCafeOutlet",
      adminId,
      outletName: payload.outletName,
      city: payload.city,
    });

    log.info("Creating cafe outlet");

    const { totalSetupCost, pricePerShare, totalShares } = payload;

    if (pricePerShare * totalShares !== totalSetupCost) {
      log.warn("Financial mismatch", {
        totalSetupCost,
        pricePerShare,
        totalShares,
      });

      throw new ApiError(
        400,
        "pricePerShare × totalShares must equal totalSetupCost",
      );
    }

    const outletCode = `CAF-${Date.now().toString(36).toUpperCase()}`;

    const cafe = await CafeOutletRepository.create({
      ...payload,
      outletCode,
      createdBy: adminId,
    });

    log.info("Cafe outlet created", {
      cafeId: cafe._id,
      outletCode,
    });

    return cafe;
  }

  static async listCafes({ page, limit, search, city, areaType }) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const filter = {
      status: {
        $in: ["LIVE", "FULLY_FUNDED", "SPV_IN_PROCESS", "OPERATIONAL"],
      },
    };

    if (city) filter.city = city;
    if (areaType) filter.areaType = areaType;

    if (search) {
      filter.$or = [
        { outletName: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      CafeOutletRepository.findPublicPaginated(filter, skip, limit),
      CafeOutletRepository.count(filter),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  static async getCafeBySlug(slug) {
    const cafe = await CafeOutletRepository.findBySlug(slug);
    if (!cafe) {
      throw new ApiError(404, "Cafe outlet not found");
    }
    return cafe;
  }

  static async listAdminCafes({ page, limit, search, city, areaType, status }) {
    page = Number(page) || 1;
    limit = Number(limit) || 100;

    const filter = {};

    if (status) filter.status = status;
    if (city) filter.city = city;
    if (areaType) filter.areaType = areaType;

    if (search) {
      filter.$or = [
        { outletName: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { outletCode: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      CafeOutletRepository.findAdminPaginated(filter, skip, limit),
      CafeOutletRepository.count(filter),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }
  static async updateCafeStatus(cafeId, status) {
    const allowedStatuses = [
      "DRAFT",
      "LIVE",
      "FULLY_FUNDED",
      "SPV_IN_PROCESS",
      "OPERATIONAL",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status value");
    }

    const cafe = await CafeOutletRepository.updateById(cafeId, { status });

    if (!cafe) {
      throw new ApiError(404, "Cafe not found");
    }

    return cafe;
  }
  static async updateCafe({ cafeId, updateData }) {
    const cafe = await CafeOutletRepository.existsById(cafeId);
    if (!cafe) throw new ApiError(404, "Cafe not found");

    const allowedFields = [
      "pincode",
      "fullAddress",
      "projectedROI",
      "carpetAreaSqFt",
      "seatingCapacity",
      "description",
      "highlights",
    ];

    const filteredData = {};

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }

    return CafeOutletRepository.updateById(cafeId, filteredData);
  }
  static async getById(cafeId) {
    const cafe = await CafeOutletRepository.findById(cafeId);
    if (!cafe) {
      throw new ApiError(404, "Cafe not found");
    }
    return cafe;
  }
}

module.exports = CafeOutletService;
