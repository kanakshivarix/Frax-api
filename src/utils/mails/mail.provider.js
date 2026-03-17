const { sendMail } = require("./mail.sender");
const { renderTemplate } = require("./mail.template");
const { logger } = require("../helpers/logger.util");

class MailProvider {
  async send({ to, subject, template, context, attachments }) {
    try {
      const html = await renderTemplate(template, context);

      if (!html) {
        logger.warn("Email skipped due to template failure", {
          template,
          to,
        });
        return;
      }

      await sendMail({ to, subject, html, attachments });
    } catch (err) {
      // FINAL SAFETY NET
      logger.error("MailProvider failed", {
        to,
        subject,
        error: err.message,
      });
      // ❌ DO NOT THROW
    }
  }
}

module.exports = new MailProvider();
