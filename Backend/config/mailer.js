const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sanvirofficials@gmail.com",
    pass: "ixwa msvz ydgm ncqq",
  },
});

module.exports = transporter;
