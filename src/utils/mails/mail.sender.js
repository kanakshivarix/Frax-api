const { EMAIL_USER } = require("../../configs/env.config");
const transporter = require("../../configs/mail.config");
const { COMPANY } = require("../../constants/app.constant");
const { logger } = require("../helpers/logger.util");

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  const log = logger.child({ action: "Email" });
  try {
    await transporter.sendMail({
      from: `"${COMPANY.NAME}" <${EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    log.info("Email sent", { to, subject });
  } catch (err) {
    log.error("Email send failed", { to, error: err.message });
    // ❌ DO NOT THROW
  }
};

module.exports = { sendMail };
