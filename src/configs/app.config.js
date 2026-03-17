const path = require("path");
const { NODE_ENV } = require("./env.config");
const { Development } = require("../constants/app.constant");

module.exports = Object.freeze({
  APP_ROOT: path.resolve(__dirname, ".."),
  IsDevelopment: NODE_ENV === Development,
});
