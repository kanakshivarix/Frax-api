const { FRONTEND_URL } = require("../configs/env.config");
const MailProvider = require("../utils/mails/mail.provider");

class MailService {
  sendVerifyEmail({ email, token }) {
    // fire-and-forget
    setImmediate(() => {
      MailProvider.send({
        to: email,
        subject: "Verify your email",
        template: "verify-email",
        context: {
          verifyUrl: `${FRONTEND_URL}/auth/verify-email?token=${token}`,
        },
      });
    });
  }
}

module.exports = new MailService();
