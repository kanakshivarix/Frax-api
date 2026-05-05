const { Property } = require("../models/index.model");

class PropertyRepository {
  static create(data) {
    return Property.create(data);
  }

  static findPublicList(filters = {}) {
  const pipeline = [
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
        description: 1,
        price: 1,
        area: 1,
        landType: 1,
        ownershipType: 1,
        location: 1,
        amenities: 1,
        tags: 1,
        ownerDetails: 1,
        isVerified: 1,
        approvalStatus: 1,
        totalShares: 1,
        soldShares: 1,
        pricePerShare: 1,
        minInvestmentShares: 1,
        maxInvestmentSharesPerUser: 1,
        status: 1,
        images: { $slice: ["$images", 1] },
        documents: 1,
        createdAt: 1,
        remainingShares: { $subtract: ["$totalShares", "$soldShares"] },
        fundingPercentage: {
          $cond: [
            { $eq: ["$totalShares", 0] },
            0,
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
          ],
        },
      },
    },
  ];

  return Property.aggregate(pipeline);
}

  static existsById(id) {
    return Property.exists({ _id: id });
  }

  static findById(id, session = null) {
    const q = Property.findById(id);
    return session ? q.session(session) : q;
  }

  static pushImage(id, image) {
    return Property.findByIdAndUpdate(
      id,
      { $push: { images: image } },
      { new: true },
    );
  }

  static pushDocument(id, doc) {
    return Property.findByIdAndUpdate(
      id,
      { $push: { documents: doc } },
      { new: true },
    );
  }

  static removeImage(id, imageId) {
    return Property.findByIdAndUpdate(
      id,
      { $pull: { images: { _id: imageId } } },
      { new: true },
    );
  }

  static removeDocument(id, docId) {
    return Property.findByIdAndUpdate(
      id,
      { $pull: { documents: { _id: docId } } },
      { new: true },
    );
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
        title: 1,
        description: 1,
        price: 1,
        pricePerUnit: 1,
        area: 1,
        landType: 1,
        ownershipType: 1,
        location: 1,
        amenities: 1,
        tags: 1,
        ownerDetails: 1,
        isVerified: 1,
        approvalStatus: 1,
        totalShares: 1,
        soldShares: 1,
        pricePerShare: 1,
        minInvestmentShares: 1,
        maxInvestmentSharesPerUser: 1,
        status: 1,
        listedBy: 1,
        images: { $slice: ["$images", 5] },
        documents: 1,
        createdAt: 1,
        remainingShares: { $subtract: ["$totalShares", "$soldShares"] },
        fundingPercentage: {
          $cond: [
            { $eq: ["$totalShares", 0] },
            0,
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
          ],
        },
      },
    },
  ];

  const properties = await Property.aggregate(pipeline);
  return properties; 
}

  static async findAdminPaginated(filter, skip, limit) {
    return Property.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
         $project: {
        id: "$_id",
        _id: 0,
        title: 1,
        description: 1,
        price: 1,
        pricePerUnit: 1,
        area: 1,
        landType: 1,
        ownershipType: 1,
        location: 1,
        amenities: 1,
        tags: 1,
        ownerDetails: 1,
        isVerified: 1,
        approvalStatus: 1,
        totalShares: 1,
        soldShares: 1,
        pricePerShare: 1,
        minInvestmentShares: 1,
        maxInvestmentSharesPerUser: 1,
        status: 1,
        listedBy: 1,
        images: { $slice: ["$images", 5] },
        documents: 1,
        createdAt: 1,
        remainingShares: { $subtract: ["$totalShares", "$soldShares"] },
        fundingPercentage: {
          $cond: [
            { $eq: ["$totalShares", 0] },
            0,
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
          ],
        },
      },

      }
    ]);
  }

  static count(filter) {
    return Property.countDocuments(filter);
  }

  static findLiveProperty(id, session = null) {
    const q = Property.findOne({ _id: id, status: "available" });
    return session ? q.session(session) : q;
  }

  static markAsPending(propertyId, session) {
    return Property.updateOne(
      { _id: propertyId, status: "available" },
      { $set: { status: "pending" } },
      { session },
    );
  }

  static markAsSold(propertyId, session) {
    return Property.updateOne(
      { _id: propertyId },
      { $set: { status: "sold" } },
      { session },
    );
  }

  static markAsAvailable(propertyId, session) {
    return Property.updateOne(
      { _id: propertyId, status: "pending" },
      { $set: { status: "available" } },
      { session },
    );
  }

  static async updateById(propertyId, updateObj) {
    return Property.findByIdAndUpdate(propertyId, updateObj, { new: true });
  }

  static async deleteById(propertyId) {
    return Property.findByIdAndDelete(propertyId);
  }
  static async incrementSoldShares(propertyId, shares, session) {
  return Property.updateOne(
    { _id: propertyId },
    { $inc: { soldShares: shares } },
    { session }
  );
}
static async getHighlightedList() {
  return Property.find({
    isHighlighted: true,
    status: "available",
  });
}

}

module.exports = PropertyRepository;
