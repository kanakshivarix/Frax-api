const BASE_URL = "http://localhost:5173";

const constants = {
  Earning_Type: {
    DIRECT_BONUS: "direct_bonus",
    EV_INCOME_SHARE: "ev_income_share",
    TREE_REFERRAL: "tree_referral",
    BINARY_MATCHING_BONUS: "binary_matching_bonus",
  },
  Earning_Status: {
    PENDING: "pending",
    PAID: "paid",
  },
  Payout_Schedule: {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
  },
};

module.exports = { BASE_URL, constants };