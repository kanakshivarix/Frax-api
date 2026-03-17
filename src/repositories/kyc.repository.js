const { KYC_STATUS } = require("../constants/app.constant");
const { Kyc } = require("../models/index.model");
const ApiError = require("../errors/ApiErrors");

class KycRepository {
  /**
   * 🔁 Derive global KYC status from document
   * Single source of truth
   */
  _computeGlobalStatusFromDoc(doc) {
    const stepStatuses = [
      doc.pan?.status ?? KYC_STATUS.NOT_SUBMITTED,
      doc.aadhaar?.status ?? KYC_STATUS.NOT_SUBMITTED,
      doc.bankDetails?.status ?? KYC_STATUS.NOT_SUBMITTED,
    ];

    const allVerified = stepStatuses.every((s) => s === KYC_STATUS.VERIFIED);

    const allRejected = stepStatuses.every((s) => s === KYC_STATUS.REJECTED);

    const anyTouched = stepStatuses.some((s) => s !== KYC_STATUS.NOT_SUBMITTED);

    if (allVerified) {
      return KYC_STATUS.VERIFIED;
    }

    if (allRejected) {
      return KYC_STATUS.REJECTED;
    }

    if (anyTouched) {
      return KYC_STATUS.IN_REVIEW;
    }

    return KYC_STATUS.NOT_SUBMITTED;
  }

  /**
   * Get or create KYC document
   */
  async getOrCreate(userId) {
    let doc = await Kyc.findOne({ userId });
    if (!doc) {
      doc = await Kyc.create({ userId });
    }
    return doc;
  }

  /**
   * Get KYC by userId
   */
  async findByUserId(userId) {
    return Kyc.findOne({ userId });
  }

  /**
   * PAN submission (User)
   */
  async upsertPan({ userId, panNumber, image }) {
    const doc = await this.getOrCreate(userId);

    doc.pan = {
      number: panNumber,
      front: image,
      status: KYC_STATUS.SUBMITTED,
      rejectionReason: null,
      verifiedAt: null,
    };

    doc.status = this._computeGlobalStatusFromDoc(doc);
    doc.verifiedAt = null;

    await doc.save(); // encryption hooks run
    return doc;
  }

  /**
   * Aadhaar submission (User)
   */
  async upsertAadhaar({ userId, aadhaarNumber, front, back }) {
    const doc = await this.getOrCreate(userId);

    doc.aadhaar = {
      number: aadhaarNumber,
      front,
      back,
      status: KYC_STATUS.SUBMITTED,
      rejectionReason: null,
      verifiedAt: null,
    };

    doc.status = this._computeGlobalStatusFromDoc(doc);
    doc.verifiedAt = null;

    await doc.save();
    return doc;
  }

  /**
   * Bank submission (User)
   */
  async upsertBank({ userId, accountNumber, ifscCode, bankName, accountHolderName, proofs }) {
    const doc = await this.getOrCreate(userId);

    doc.bankDetails = {
      accountNumber,
      ifscCode,
      bankName,
      accountHolderName,
      proofs,
      status: KYC_STATUS.SUBMITTED,
      rejectionReason: null,
      verifiedAt: null,
    };

    doc.status = this._computeGlobalStatusFromDoc(doc);
    doc.verifiedAt = null;

    await doc.save();
    return doc;
  }

  /**
   * Address submission (User)
   * Does NOT affect KYC status
   */
  async upsertAddress({ userId, address }) {
    const doc = await this.getOrCreate(userId);
    doc.address = address;
    await doc.save();
    return doc;
  }

  /**
   * KYC verification / rejection (Admin ONLY)
   */
  async updateStepStatus({ userId, step, status, rejectionReason = null }) {
    const now = new Date();

    // 1️⃣ Update step explicitly (admin authority)
    await Kyc.updateOne(
      { userId },
      {
        $set: {
          [`${step}.status`]: status,
          [`${step}.rejectionReason`]: status === KYC_STATUS.REJECTED ? rejectionReason : null,
          [`${step}.verifiedAt`]: status === KYC_STATUS.VERIFIED ? now : null,
        },
      },
    );

    // 2️⃣ Fetch updated doc
    const kyc = await Kyc.findOne({ userId });
    if (!kyc) {
      throw new ApiError(404, "KYC record not found");
    }

    // 3️⃣ Recompute global status deterministically
    const globalStatus = this._computeGlobalStatusFromDoc(kyc);

    await Kyc.updateOne(
      { userId },
      {
        $set: {
          status: globalStatus,
          verifiedAt: globalStatus === KYC_STATUS.VERIFIED ? now : null,
        },
      },
    );

    return Kyc.findOne({ userId });
  }

  async findImageById({ userId, imageId }) {
    const kyc = await Kyc.findOne({ userId });
    if (!kyc) return null;

    const images = [];

    if (kyc.pan?.front) images.push(kyc.pan.front);

    if (kyc.aadhaar?.front) images.push(kyc.aadhaar.front);
    if (kyc.aadhaar?.back) images.push(kyc.aadhaar.back);

    if (kyc.bankDetails?.proofs?.length) {
      images.push(...kyc.bankDetails.proofs);
    }

    return images.find((img) => img._id.toString() === imageId) || null;
  }
  async list({ page, limit, status, search }) {
    const skip = (page - 1) * limit;

    const match = {};
    if (status) match.status = status;

    const pipeline = [
      { $match: match },

      // join user
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "user.phone": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { "user.fullname": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          id: "$_id",
          _id: 0,

          pan: 1,
          aadhaar: 1,
          bankDetails: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,

          user: {
            id: "$user._id",
            fullname: "$user.fullname",
            phone: "$user.phone",
            email: "$user.email",
          },
        },
      },
    );

    const [data, total] = await Promise.all([Kyc.aggregate(pipeline), Kyc.countDocuments(match)]);

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findForAdminDetail(userId) {
    const doc = await Kyc.findOne({ userId })
      .select("+pan.number +aadhaar.number +bankDetails.accountNumber")
      .populate("userId", "fullname phone email username");

    if (!doc) return null;

    return doc.toObject({
      getters: true,
      virtuals: true,
    });
  }
}

module.exports = new KycRepository();
