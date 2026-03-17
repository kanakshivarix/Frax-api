const { OtpSession } = require("../models/index.model");

class OtpSessionRepository {
  async findByPhone(phone) {
    return OtpSession.findOne({ phone });
  }

  async upsert(data) {
    return OtpSession.findOneAndUpdate({ phone: data.phone }, data, { upsert: true, new: true });
  }

  async deleteByPhone(phone) {
    return OtpSession.deleteOne({ phone });
  }
}

module.exports = new OtpSessionRepository();
