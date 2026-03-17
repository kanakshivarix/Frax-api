const ApiError = require("../errors/ApiErrors");
const { EV } = require("../models/ev.model");
const { ImageEV } = require("../models/evImage.model");
const { uploadImageToS3 } = require("../utils/helpers/aws.util");
const { logger } = require("../utils/helpers/logger.util");

class EVService {
  static async createEV({ model, totalPrice, totalShares, expectedMonthlyIncome, files }) {
    logger.info(`Creating EV: ${model}`);

    // Check for existing EV model
    const existingEV = await EV.findOne({ model, isDeleted: false });
    if (existingEV) {
      logger.error(`EV model already exists: ${model}`);
      throw new ApiError(400, "EV model already exists");
    }
    const ev = new EV({
      model,
      totalPrice,
      totalShares,
      expectedMonthlyIncome,
    });

    if (files && files.length > 0) {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const s3Image = await uploadImageToS3({
            name: file.originalname,
            data: file.buffer,
            mimetype: file.mimetype,
          });
          const image = new ImageEV({
            ev: ev._id,
            url: s3Image.url,
            fileName: s3Image.fileName,
            originalName: s3Image.originalName,
          });
          await image.save();
          return image._id;
        })
      );
      ev.images = uploadedImages;
    }

    await ev.save();
    logger.info(`EV created: ${model}, ID: ${ev._id}`);
    return { message: "EV created", evId: ev._id };
  }

  static async updateEV(id, { model, totalPrice, totalShares, expectedMonthlyIncome }) {
    logger.info(`Updating EV ID: ${id}`);
    const ev = await EV.findOne({ _id: id, isDeleted: false });
    if (!ev) {
      logger.error(`EV not found: ${id}`);
      throw new ApiError(404, "EV not found");
    }
    if (totalShares !== undefined && totalShares < ev.bookedShares) {
      logger.error(
        `Cannot set totalShares (${totalShares}) below bookedShares (${ev.bookedShares})`
      );
      throw new ApiError(400, "Total shares cannot be less than booked shares");
    }
    const updateData = {};
    if (model !== undefined) updateData.model = model;
    if (totalPrice !== undefined) updateData.totalPrice = totalPrice;
    if (totalShares !== undefined) updateData.totalShares = totalShares;
    if (expectedMonthlyIncome !== undefined)
      updateData.expectedMonthlyIncome = expectedMonthlyIncome;

    const updatedEV = await EV.findOneAndUpdate({ _id: id, isDeleted: false }, updateData, {
      new: true,
    });
    if (!updatedEV) {
      logger.error(`EV update failed: ${id}`);
      throw new ApiError(404, "EV not found");
    }
    logger.info(`EV updated: ${id}`);
    return "EV updated";
  }

  static async deleteEV(id) {
    logger.info(`Deleting EV ID: ${id}`);
    const ev = await EV.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!ev) {
      logger.error(`EV not found: ${id}`);
      throw new ApiError(404, "EV not found");
    }
    logger.info(`EV deleted: ${id}`);
    return "EV deleted";
  }

  static async listEVs({ page = 1, limit = 10, search, sort, sortOrder = "asc", hasShares }) {
    logger.info(`Listing EVs: page=${page}, limit=${limit}, search=${search || "none"}`);

    // Build query
    const query = { isDeleted: false };

    // Add search by model
    if (search) {
      query.model = { $regex: search, $options: "i" }; // Case-insensitive
    }

    // Add hasShares filter
    if (hasShares) {
      query.bookedShares = { $lt: query.totalShares || 0 };
    }

    // Build sort
    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    // Fetch EVs with pagination
    const total = await EV.countDocuments(query);
    const evs = await EV.find(query)
      .populate("images")
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    logger.info(`Found ${evs.length} EVs of ${total} total`);
    return {
      evs,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    };
  }
}

module.exports = { EVService };
