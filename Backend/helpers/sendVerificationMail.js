const transporter = require("../config/mailer");
const { verificationEmailTemplate } = require("../templates/verificationEmail");

async function sendVerificationMail(email, otp) {
  try {
    await transporter.sendMail({
      from: "sanvirislam10@gmail.com",
      to: email,
      subject: "Verification email from Zenith",
      html: verificationEmailTemplate(otp),
    });
  } catch (err) {
    throw new Error("Error in sending mail");
  }
}

module.exports = sendVerificationMail;
