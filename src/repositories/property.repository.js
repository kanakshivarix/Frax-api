const { Property } = require("../models/index.model");

class PropertyRepository {
  static create(data) {
    return Property.create(data);
  }

  static findPublicList(filters = {}) {
    return Property.aggregate([
      {
        $match: {
          status: "available",
          ...filters,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          id: "$_id",
          _id: 0,
          title: 1,
          price: 1,
          pricePerUnit: 1,
          area: 1,
          landType: 1,
          ownershipType: 1,
          location: 1,
          amenities: 1,
          tags: 1,
          status: 1,
          coverImage: 1, // Assuming they might want a coverImage still, or maybe images[0]
          images: { $slice: ["$images", 1] },
          createdAt: 1,
        },
      },
    ]);
  }

  static findById(id, session = null) {
    const q = Property.findById(id);
    return session ? q.session(session) : q;
  }

  static existsById(id) {
    return Property.exists({ _id: id });
  }

  static pushImage(id, image) {
    return Property.findByIdAndUpdate(
      id,
      { $push: { images: image } },
      { new: true },
    );
  }

  static pushDocument(id, docObj) {
    return Property.findByIdAndUpdate(
      id,
      { $push: { documents: docObj } },
      { new: true },
    );
  }

  static async findPublicPaginated(filter, skip, limit) {
    const { getPublicUrlFromS3 } = require("../utils/helpers/aws.util");
    const pipeline = [
      { $match: { ...filter, status: "available" } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: "$_id",
          _id: 0,
          title: 1,
          price: 1,
          pricePerUnit: 1,
          area: 1,
          landType: 1,
          ownershipType: 1,
          location: 1,
          amenities: 1,
          tags: 1,
          status: 1,
          documents: 1,
          images: { $slice: ["$images", 5] },
          createdAt: 1,
        },
      },
    ];

    const items = await Property.aggregate(pipeline);
    
    // Inject image URLs since aggregate doesn't run Mongoose virtuals
    return items.map(item => {
      if (item.images && Array.isArray(item.images)) {
        item.images = item.images.map(img => ({
          ...img,
          url: img.key ? getPublicUrlFromS3(img.key) : undefined
        }));
      }
      return item;
    });
  }

  static async findAdminPaginated(filter, skip, limit) {
    const { getPublicUrlFromS3 } = require("../utils/helpers/aws.util");
    const items = await Property.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: "$_id",
          _id: 0,
          title: 1,
          price: 1,
          pricePerUnit: 1,
          area: 1,
          landType: 1,
          ownershipType: 1,
          location: 1,
          amenities: 1,
          tags: 1,
          approvalStatus: 1,
          status: 1,
          documents: 1,
          images: { $slice: ["$images", 5] },
          createdAt: 1,
        },
      },
    ]);

    // Inject image URLs since aggregate doesn't run Mongoose virtuals
    return items.map(item => {
      if (item.images && Array.isArray(item.images)) {
        item.images = item.images.map(img => ({
          ...img,
          url: img.key ? getPublicUrlFromS3(img.key) : undefined
        }));
      }
      return item;
    });
  }

  static count(filter) {
    return Property.countDocuments(filter);
  }

  static findLiveOutlet(id, session = null) {
    const q = Property.findOne({ _id: id, status: "available" });
    return session ? q.session(session) : q;
  }

  static async updateById(propertyId, updateObj) {
    return Property.findByIdAndUpdate(propertyId, updateObj, { new: true });
  }

  static async deleteById(propertyId) {
    return Property.findByIdAndDelete(propertyId);
  }

  static async reserveShares(propertyId, shares, session) {
  return Property.findOneAndUpdate(
    {
      _id: propertyId,
      status: "available",
    },
    {
      $inc: {
        remainingShares: -shares,
      },
    },
    {
      new: true,
      session,
    }
  );
}


}

module.exports = PropertyRepository;
