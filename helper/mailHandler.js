const nodemailer = require("nodemailer");
const config = require("../src/config/config");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: config.emailUser,
      to,
      subject,
      text,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

module.exports = sendEmail;