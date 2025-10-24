const { mailer } = require("./mail"); // ✅ Make sure this file exists and exports mailer

exports.sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await mailer.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USERNAME}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("📩 Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email error:", error);
  }
};

