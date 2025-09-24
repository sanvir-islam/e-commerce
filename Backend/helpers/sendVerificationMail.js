const transporter = require("../config/mailer");

async function sendVerificationMail(email, otp) {
  await transporter.sendMail({
    from: "sanvirislam10@gmail.com",
    to: email,
    subject: "Verification email from Zenith",
    html: `<b>u have 2 min <br/> boy ur funcking otp is ${otp}</b>`,
  });

  console.log("Message sent to ", email);
}

module.exports = sendVerificationMail;
