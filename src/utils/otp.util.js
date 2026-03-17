const { IsDevelopment } = require("../configs/app.config");

const generateOtp = () =>
  IsDevelopment ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();

const getOtpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

module.exports = { generateOtp, getOtpExpiry };
