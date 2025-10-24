const nodemailer = require("nodemailer");
require("dotenv").config();
const mailer = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 587,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "b8bffba1421f9a",
    pass: "0832e29dad9558",
  },
});
const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await mailer.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USERNAME}>`,
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    console.error("❌ Email error:", error);
    throw error;
  }
};


exports.sendResetOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000; // expires in 10 minutes

    // Save OTP in DB
    user.resetOtp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const { subject, html } = generateEmailTemplate("otp", user.name, otp);

    await sendMail({
      to: user.email,
      subject,
      html,
    });

    res.status(200).json({ status: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ status: false, message: "Something went wrong" });
  }
};
const generateEmailTemplate = (type, recipientName, actionLink) => {
  let subject, title, message, buttonText;
  switch (type) {
    case "verify":
      subject = "Please verify your email - Brenin";
      title = "Verify Your Email Address";
      message = `Hi ${recipientName},<br/><br/>Thank you for registering with us. Please verify your email by clicking the link below.`;
      buttonText = "Verify Email";
      break;

    case "otp":
      subject = "Your OTP for Password Reset - Brenin";
      title = "Reset Password OTP";
      message = `Hi ${recipientName},<br/><br/>Use the OTP below to reset your password. It will expire in 10 minutes.`;
      buttonText = `OTP: ${actionLink}`; // use OTP as the "button"
      break;

    case "reset":
      subject = "Reset your password - Brenin";
      title = "Reset Your Password";
      message = `Hi ${recipientName},<br/><br/>We received a request to reset your password. Click the button below to reset it.`;
      heading = "Reset Password";
      break;

    case "enquiry":
      subject = "Thank you for your enquiry - Brenin";
      title = "We Received Your Enquiry";
      message = `Hi ${recipientName},<br/><br/>Thank you for reaching out to us. We have received your enquiry and our team will get back to you shortly. You can check the status of your enquiry by clicking the link below.`;
      buttonText = "More Information";
      break;

    default:
      throw new Error("Invalid email type");
  }

  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
    <style>
        /* Basic styling */
        body, table, td, a {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            text-decoration: none;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .email-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #f8f9fa;
            text-align: center;
            height: 260px;
            width: 100%;
        }
        .email-header img {
            max-width: 100%;
            height: 100%;
            object-fit: cover; /* Ensures the image fills the container */
        }
        .email-hero {
            background-color: #f8f9fa;
            text-align: center;
            padding: 20px;
        }
        .email-hero h2 {
            font-size: 22px;
            color: #333;
            margin: 0 0 10px;
        }
        .email-hero p {
            color: #555;
            margin: 10px 0;
        }
        .email-button {
            padding: 12px 24px;
            // background-color: #279be3;
            color: #008000;

            border-radius: 4px;
            text-decoration: none;
            display: inline-block;
            margin-top: 10px;
        }
        .email-content {
            padding: 20px;
            color: #333;
            font-size: 14px;
            text-align: center; /* Corrected here */
        }
        .email-footer {
            background-color: #f1f1f1;
            text-align: center;
            padding: 20px;
            color: #777;
            font-size: 12px;
        }
        .email-footer img {
            max-width: 120px;
            margin-top: 10px;
        }
            .ii a[href]{
            color: #FFFFFF !important;
            }
    </style>
</head>
<body>
    <table class="email-container">
        <!-- Header -->
        <tr>
            <td class="email-header">
                <img src="https://drive.google.com/uc?export=view&id=1Evk3iZ89A9VGvFFFT0A_wcntr7K7d6iq" alt="Header Image">
            </td>
        </tr>
        <!-- Hero Section -->
        <tr>
            <td class="email-hero">
                <h2>${title}</h2>
                <p>${message}</p>
                <h2 class="email-button">${buttonText}</h2>
            </td>
        </tr>
        <!-- Main Content -->
        <tr>
            <td class="email-content">
                <p>If you did not request this, please ignore this email.</p>
            </td>
        </tr>
        <!-- Footer -->
        <tr>
            <td class="email-footer">
                <p>&copy; 2024 Brenin || All rights reserved.</p>
                <img src="https://drive.google.com/uc?export=view&id=1ZQq6WzUfiD1ex-M6ZVC_30zlV6t_jxnv" alt="Company Logo" class="email-logo">
            </td>
        </tr>
    </table>
</body>
</html>
`,
  };
};

module.exports = {
  mailer,
  transport,
  sendMail,
  generateEmailTemplate,
};
