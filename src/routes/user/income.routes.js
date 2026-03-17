const express = require("express");
const { authMiddleware } = require("../../middlewares/auth.middleware");
const ApiError = require("../../errors/ApiErrors");
const ApiResponse = require("../../utils/helpers/ApiResponse.util");
const IncomeService = require("../../services/income.service");

const router = express.Router();

router.get("/my-income/:period", authMiddleware, async (req, res) => {
  const { period } = req.params;
  const userId = req.user._id;

  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    throw new ApiError(400, "Invalid period format (YYYY-MM)");
  }

  const result = await IncomeService.getUserIncome(userId, period);
  res.json(new ApiResponse(200, result, "Income fetched successfully"));
});

router.post("/distribute-income", async (req, res, next) => {
  try {
    // You can also read period from req.body if needed
    const result = await IncomeService.distributeIncome("2025-06");
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
