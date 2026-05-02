const { default: mongoose } = require("mongoose");
const { Investment } = require("../models/index.model");

class InvestmentRepository {
  static create(data, session) {
    return Investment.create([data], { session });
  }

  static approve(investmentId, adminId, session) {
    return Investment.findOneAndUpdate(
      { _id: investmentId, status: "PAYMENT_UPLOADED" },
      {
        $set: {
          status: "ADMIN_APPROVED",
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      },
      { new: true, session },
    );
  }

  static reject(investmentId, reason, adminId, session) {
    return Investment.findOneAndUpdate(
      { _id: investmentId, status: "PAYMENT_UPLOADED" },
      {
        status: "ADMIN_REJECTED",
        rejectionReason: reason,
        approvedAt: new Date(),
        approvedBy: adminId,
      },
      { new: true, session },
    );
  }

  static findById(id, session) {
    return Investment.findById(id).session(session);
  }

  static findAdminList(filter, skip, limit, search) {
    const pipeline = [
      { $match: filter },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "propertyObj",
        },
      },
      { $unwind: "$propertyObj" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "user.firstName": { $regex: search, $options: "i" } },
            { "user.lastName": { $regex: search, $options: "i" } },
            { "user.phone": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { "propertyObj.title": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          id: "$_id",
          _id: 0,

          investmentRef: 1,
          shares: 1,
          totalAmount: 1,
          status: 1,
          createdAt: 1,

          user: {
            id: "$user._id",
            firstName: "$user.firstName",
            lastName: "$user.lastName",

            phone: "$user.phone",
          },

          propertyObj: {
            id: "$propertyObj._id",
            title: "$propertyObj.title",
            city: "$propertyObj.location.city",
          },
        },
      },
    );
    return Investment.aggregate(pipeline);
  }

  static async count(filter, search) {
    if (!search) {
      return Investment.countDocuments(filter);
    }
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "propertyObj",
        },
      },
      { $unwind: "$propertyObj" },
      {
        $match: {
          $or: [
            { "user.firstName": { $regex: search, $options: "i" } },
            { "user.lastName": { $regex: search, $options: "i" } },
            { "user.phone": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { "propertyObj.title": { $regex: search, $options: "i" } },
          ],
        },
      },
      { $count: "total" }
    ];
    const res = await Investment.aggregate(pipeline);
    return res.length > 0 ? res[0].total : 0;
  }

  static findAdminById(investmentId) {
    return Investment.findById(investmentId)
      .populate("userId", "firstName lastName email phone")
      .populate({
        path: "propertyId",
        select: {
          _id: 0,
          id: "$_id",
          title: 1,
          "location.city": 1,
          "location.state": 1,
          price: 1,
        },
      });
  }

  // USER LIST
  static findUserList({ userId, ...filter }, skip, limit) {
    return Investment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          ...filter,
        },
      },

      // join property
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "propertyObj",
        },
      },
      { $unwind: "$propertyObj" },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          id: "$_id",
          _id: 0,

          investmentRef: 1,
          shares: 1,
          totalAmount: 1,
          status: 1,
          createdAt: 1,

          propertyObj: {
            id: "$propertyObj._id",
            title: "$propertyObj.title",
            city: "$propertyObj.location.city",
          },
        },
      },
    ]);
  }

  // USER SINGLE (ownership enforced in query)
  static findUserById({ userId, investmentId }) {
    return Investment.findOne(
      { _id: investmentId, userId },
      {
        _id: 0,
        id: "$_id",
        investmentRef: 1,
        shares: 1,
        totalAmount: 1,
        status: 1,
        createdAt: 1,
        propertyId: 1,
      },
    )
      .populate({
        path: "propertyId",
        select: {
          _id: 0,
          id: "$_id",
          title: 1,
          "location.city": 1,
          "location.state": 1,
        },
      })
      .lean();
  }
  static updateInvoice(investmentId, invoiceData, session) {
    return Investment.updateOne(
      { _id: investmentId },
      { $set: { invoice: invoiceData } },
      { session },
    );
  }
}

module.exports = InvestmentRepository;
