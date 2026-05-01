const { KYC_STATUS } = require("../constants/app.constant");
const { Kyc } = require("../models/index.model");
const ApiError = require("../errors/ApiErrors");

class KycRepository {
  /**
   * 🔁 Derive global KYC status
   */
  _computeGlobalStatusFromDoc(doc) {
    const stepStatuses = [
      doc.pan?.status ?? KYC_STATUS.NOT_SUBMITTED,
      doc.aadhaar?.status ?? KYC_STATUS.NOT_SUBMITTED,
      doc.bankDetails?.status ?? KYC_STATUS.NOT_SUBMITTED,
      doc.selfie?.status ?? KYC_STATUS.NOT_SUBMITTED, // ✅ added
    ];

    const allVerified = stepStatuses.every((s) => s === KYC_STATUS.VERIFIED);
    const allRejected = stepStatuses.every((s) => s === KYC_STATUS.REJECTED);
    const anyTouched = stepStatuses.some((s) => s !== KYC_STATUS.NOT_SUBMITTED);

    if (allVerified) return KYC_STATUS.VERIFIED;
    if (allRejected) return KYC_STATUS.REJECTED;
    if (anyTouched) return KYC_STATUS.IN_REVIEW;

    return KYC_STATUS.NOT_SUBMITTED;
  }

  /**
   * Get or create KYC
   */
  async getOrCreate(userId) {
    let doc = await Kyc.findOne({ userId });
    if (!doc) doc = await Kyc.create({ userId });
    return doc;
  }

  async findByUserId(userId) {
    return Kyc.findOne({ userId });
  }

  /**
   * PAN
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

    await doc.save();
    return doc;
  }

  /**
   * Aadhaar
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
   * Bank
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
   * Selfie ✅ NEW
   */
  async upsertSelfie({ userId, images }) {
    const doc = await this.getOrCreate(userId);

    doc.selfie = {
      image: images,
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
   * Address
   */
  async upsertAddress({ userId, address }) {
    const doc = await this.getOrCreate(userId);
    doc.address = address;
    await doc.save();
    return doc;
  }

  /**
   * Admin update
   */
  async updateStepStatus({ userId, step, status, rejectionReason = null }) {
    const now = new Date();

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

    const kyc = await Kyc.findOne({ userId });
    if (!kyc) throw new ApiError(404, "KYC record not found");

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

  /**
   * Find image
   */
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

    if (kyc.selfie?.image?.length) {
      images.push(...kyc.selfie.image); 
    }

    return images.find((img) => img?._id?.toString() === imageId) || null;
  }


  async list({ page, limit, status, search }) {
    const safePage=Math.max(1,Number(page)||1);
    const safeLimit=Math.min(100,Math.max(1,Number(limit)||10));
    const skip = (safePage - 1) * safeLimit;

    const match = {};
    if (status) match.status = status;

    const pipeline = [
      { $match: match },
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
            { "user.firstName": { $regex: search, $options: "i" } },
            {"user.lastName":{$regex:search,$options:"i"}},
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: safeLimit },
      {
        $project: {
          id: "$_id",
          _id: 0,

          pan: 1,
          aadhaar: 1,
          bankDetails: 1,
          selfie: 1, // ✅ added

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

    const [data, total] = await Promise.all([
      Kyc.aggregate(pipeline),
      Kyc.countDocuments(match),
    ]);

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