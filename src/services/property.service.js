const ApiError = require("../errors/ApiErrors");
const PropertyRepository = require("../repositories/property.repository");
const { logger } = require("../utils/helpers/logger.util");
const { getSignedUrlFromS3 } = require("../utils/helpers/aws.util");

class PropertyService {
  static async createProperty(data, adminId) {
    const log = logger.child({ action: "property:create", adminId });
    try {
      const property = await PropertyRepository.create({
        ...data,
        listedBy: adminId,
      });
      log.info("Property created", { propertyId: property._id });
      return property;
    } catch (err) {
      log.error({ err }, "Failed to create property");
      if (err.code === 11000) {
        throw new ApiError(409, "Property with this title already exists");
      }
      throw new ApiError(400, "Failed to create property: " + err.message);
    }
  }

  static async updateProperty(propertyId, updateData, adminId) {
    const log = logger.child({
      action: "property:update",
      propertyId,
      adminId,
    });

    const exists = await PropertyRepository.existsById(propertyId);
    if (!exists) throw new ApiError(404, "Property not found");

    const property = await PropertyRepository.updateById(
      propertyId,
      updateData,
    );
    log.info("Property updated");
    return property;
  }
  static async getPublicProperties(query) {
    const rawPage = query?.page;
    const rawLimit = query?.limit;

    const page = Number(rawPage) > 0 ? Number(rawPage) : 1;
    const limit = Number(rawLimit) > 0 ? Number(rawLimit) : 10;
    const skip = (page - 1) * limit;

    const filter = { status: "available" };
    if (query?.city)
      filter["location.city"] = new RegExp(`^${query.city}$`, "i");
    if (query?.landType) filter.landType = query.landType;

    const [items, total] = await Promise.all([
      PropertyRepository.findPublicPaginated(filter, skip, limit),
      PropertyRepository.count(filter),
    ]);

    const updatedItems = await Promise.all(
      (items || []).map(async (item) => {
        const imagesWithUrl = await Promise.all(
          (item.images || []).map(async (img) => ({
            ...img,
            url: await getSignedUrlFromS3(img.key),
          })),
        );

        return {
          ...item,
          images: imagesWithUrl,
        };
      }),
    );

    return {
      items: updatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getAdminProperties(query) {
    const rawPage = query?.page;
    const rawLimit = query?.limit;

    const page =
      Number.isInteger(Number(rawPage)) && Number(rawPage) > 0
        ? Number(rawPage)
        : 1;
    const limit =
      Number.isInteger(Number(rawLimit)) && Number(rawLimit) > 0
        ? Number(rawLimit)
        : 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query?.status) filter.status = query.status;
    if (query?.approvalStatus) filter.approvalStatus = query.approvalStatus;

    const [items, total] = await Promise.all([
      PropertyRepository.findAdminPaginated(filter, skip, limit),
      PropertyRepository.count(filter),
    ]);
    const updatedItems = await Promise.all(
      (items || []).map(async (item) => {
        const imagesWithUrl = await Promise.all(
          (item.images || []).map(async (img) => ({
            ...img,
            url: await getSignedUrlFromS3(img.key),
          })),
        );

        return {
          ...item,
          images: imagesWithUrl,
        };
      }),
    );

    return {
      items: updatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getPropertyById(propertyId) {
    const property = await PropertyRepository.findById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    // images ke liye signed URL
    const imagesWithUrl = await Promise.all(
      (property.images || []).map(async (img) => ({
        ...img.toObject(),
        url: await getSignedUrlFromS3(img.key),
      })),
    );

    // documents ke liye signed URL
    const documentsWithUrl = await Promise.all(
      (property.documents || []).map(async (doc) => ({
        ...doc.toObject(),
        url: await getSignedUrlFromS3(doc.key),
      })),
    );

    return {
      ...property.toObject(),
      images: imagesWithUrl,
      documents: documentsWithUrl,
    };
  }

  static async deleteProperty(propertyId, adminId) {
    const log = logger.child({
      action: "property:delete",
      propertyId,
      adminId,
    });
    const exists = await PropertyRepository.existsById(propertyId);
    if (!exists) throw new ApiError(404, "Property not found");

    await PropertyRepository.deleteById(propertyId);
    log.info("Property deleted");
    return { success: true };
  }
}

module.exports = PropertyService;
