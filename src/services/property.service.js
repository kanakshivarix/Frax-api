const ApiError = require("../errors/ApiErrors");
const PropertyRepository = require("../repositories/property.repository");
const { uploadImageToS3,deleteFromS3, uploadDocumentToS3, getPublicUrlFromS3,getSignedUrlFromS3} = require("../utils/helpers/aws.util");
const { logger } = require("../utils/helpers/logger.util");


class PropertyService {
  static async createProperty({ adminId, payload, files }) {
    const log = logger.child({
      action: "createProperty",
      adminId,
      title: payload.title,
    });

    log.info("Creating property");

    // We first generate an ObjectId so we can use it for S3 folder naming
    const mongoose = require("mongoose");
    const propertyId = new mongoose.Types.ObjectId();

    const property = await PropertyRepository.create({
      _id: propertyId,
      ...payload,
      images: [],
      documents: [],
      listedBy: {
        userId: adminId,
      },
    });

    log.info("Property created", {
      propertyId: property._id,
    });

    return property;
  }

  static async listProperties({ page, limit, search, city, landType }) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const filter = {};
    if (city) filter["location.city"] = city;
    if (landType) filter.landType = landType;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      PropertyRepository.findPublicPaginated(filter, skip, limit),
      PropertyRepository.count({ ...filter, status: "available" }),
    ]);
  
    const updatedItems = await Promise.all(
  items.map(async (property) => {
    const obj = property

    if (obj.images?.length) {
      obj.images = await Promise.all(
        obj.images.map(async (img) => ({
          ...img,
          url: await getSignedUrlFromS3(img.key),
        }))
      );
    }

    return obj;
  })
);
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items:updatedItems
    };
  }

  static async getPropertyBySlug(slug) {
    // Note: Assuming we query by title or some slug if slug plugin is added later.
    // For now, if we use ID instead of slug in the future, we should rename this method.
    // Let's keep it as is, but search by slug if we added a slug field, otherwise id.
    const property = await PropertyRepository.findBySlug(slug);
    if (!property) {
      throw new ApiError(404, "Property not found");
    }
    return property;
  }

  static async listAdminProperties({ page, limit, search, city, landType, status }) {
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    const filter = {};

    if (status) filter.status = status;
    if (city) filter["location.city"] = city;
    if (landType) filter.landType = landType;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PropertyRepository.findAdminPaginated(filter, skip, limit),
      PropertyRepository.count(filter),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  static async updatePropertyStatus(propertyId, status) {
    const allowedStatuses = [
      "available",
      "sold",
      "pending",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status value");
    }

    const property = await PropertyRepository.updateById(propertyId, { status });

    if (!property) {
      throw new ApiError(404, "Property not found");
    }

    return property;
  }

  static async updateProperty({ propertyId, updateData, files }) {
    const property = await PropertyRepository.existsById(propertyId);
    if (!property) throw new ApiError(404, "Property not found");

    const allowedFields = [
      "title",
      "description",
      "price",
      "pricePerUnit",
      "area",
      "landType",
      "ownershipType",
      "location",
      "amenities",
      "tags",
      "isVerified",
      "approvalStatus",
      "status"
    ];

    const filteredData = {};

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        filteredData[key] = updateData[key];
      }
    }
      if (files && files.length > 0) {
    if (property.images?.length) {
      for (const img of property.images) {
        if (img.key) {
          await deleteFromS3(img.key);
        }
      }
    }

    // 2. upload new images
    const uploadedImages = [];

    for (const file of files) {
      const image = await uploadImageToS3({
        file,
        folderName: `properties/${propertyId}/images`,
      });

      uploadedImages.push(image);
    }

    filteredData.images = uploadedImages;
  }
    

    return PropertyRepository.updateById(propertyId, filteredData);
  }

  static async getById(propertyId) {
  const property = await PropertyRepository.findById(propertyId);
  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  const obj = property

  if (obj.images?.length) {
    obj.images = await Promise.all(
      obj.images.map(async (img) => ({
        ...img,
        url: await getSignedUrlFromS3(img.key),
      }))
    );
  }
  if (obj.documents?.length) {
    obj.documents = await Promise.all(
      obj.documents.map(async (doc) => ({
        ...doc,
        url: await getSignedUrlFromS3(doc.key),
      }))
    );
  }

  return obj;
}

  static async deleteProperty(propertyId) {
    const property = await PropertyRepository.findById(propertyId);
    if (!property) {
      throw new ApiError(404, "Property not found");
    }



    // Delete gallery images if any (assuming they are strings of URLs or objects with keys)
    if (property.images && property.images.length > 0) {
      for (const img of property.images) {
        // If images is an array of strings (urls), extracting key depends on format. 
        // If it's a direct S3 key string:
        // await deleteFromS3(img).catch(e => logger.warn("Failed", e));
      }
    }

    await PropertyRepository.deleteById(propertyId);
    return true;
  }
}

module.exports = PropertyService;
