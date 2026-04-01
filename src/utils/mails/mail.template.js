const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const { logger } = require("../helpers/logger.util");

const TEMPLATE_BASE_PATH = path.join(process.cwd(), "src", "views", "emails");

const renderTemplate = async (templateName, data = {}) => {
  const log = logger.child({ action: "renderEmailTemplate" });
  try {
    const templatePath = path.join(TEMPLATE_BASE_PATH, `${templateName}.ejs`);

    if (!fs.existsSync(templatePath)) {
      log.error("Email template missing", { templatePath });
      return null; // ⬅️ DO NOT THROW
    }

    return await ejs.renderFile(templatePath, data);
  } catch (err) {
    log.error("Email template render failed", {
      templateName,
      error: err.message,
    });
    return null; // ⬅️ DO NOT THROW
  }
};

module.exports = {
  renderTemplate,
};
