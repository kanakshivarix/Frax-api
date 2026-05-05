module.exports = Object.freeze({
  User_Type: {
    SUPER_ADMIN: "super_admin",
    USER: "user",
  },
  Development: "development",
  JSON_LIMIT: "10mb",
  saltRounds: 10,
  LOGGING: {
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    MAX_FILES: 5,
  },
  COMPANY: {
    NAME: "CAFE MANAGEMENT",
  },
  KYC_STATUS: {
    NOT_SUBMITTED: "Not Submitted",
    SUBMITTED: "Submitted",
    IN_REVIEW: "In Review",
    VERIFIED: "Verified",
    REJECTED: "Rejected",
  },
  Payment_Method: {
    BANK_TRANSFER: "BANK_TRANSFER",
  },
  Earning_Type: {
    DIRECT_BONUS: "direct_bonus",
  },
  Earning_Status: {
    PENDING: "pending",
    PARTIALLY_PAID: "partially_paid",
    PAID: "paid",
  },
  Payout_Schedule: {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
  },
});
