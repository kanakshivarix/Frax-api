const { asyncHandler } = require("../utils/helpers/asyncHandler.util");
const InvestmentService = require("../services/investment.service");

class InvestMentController {
  static createInvestment = asyncHandler(async (req, res) => {
    await InvestmentService.createInvestment({
      userId: req.user.userId,
      body: req.body,
      paymentProof: req.files?.paymentProof?.[0],
    });

    return res.sendRes(201, null, "Investment submitted for approval");
  });
  static listMine = asyncHandler(async (req, res) => {
    const result = await InvestmentService.listMyInvestments({
      userId: req.user.userId,
      query: req.query,
    });

    return res.sendRes(200, result);
  });

  static getMineById = asyncHandler(async (req, res) => {
    const investment = await InvestmentService.getMyInvestmentById({
      userId: req.user.userId,
      investmentId: req.params.investmentId,
    });

    return res.sendRes(200, investment);
  });
}

module.exports = InvestMentController;
