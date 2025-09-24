const userSchema = require("../model/userSchema");
const emailRegex = require("../helpers/emailRegex");
const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const sendVerificationMail = require("../helpers/sendVerificationMail");

async function register(req, res) {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName) {
    return res.json({
      message: "firstName is required",
    });
  }
  if (!lastName) {
    return res.status(400).json({
      message: "lastName is required",
    });
  }
  if (!email) {
    return res.status(400).json({
      message: "email is required",
    });
  } else if (!emailRegex(email)) {
    return res.status(400).json({
      message: "Invalid email address",
    });
  }
  if (!password) {
    return res.status(400).json({
      message: "email is required",
    });
  }
  try {
    const existUser = await userSchema.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "Email already exist" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new userSchema({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });

    await user.save();

    res.status(201).json({
      message: "Registration successfull",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: "server error" });
  }
}

async function requestVerification(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "email is required" });
  } else if (!emailRegex(email)) {
    return res.status(400).json({
      message: "Invalid email address",
    });
  }
  try {
    // generate 4 digit otp
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Expiry = 2min
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);

    // update in DB
    const user = await userSchema.findOneAndUpdate(
      { email: email },
      {
        otp: hashedOTP, // The new hashed OTP
        otpExpiry: otpExpiry,
        otpAttempts: 0,
        lockedUntil: null,
      },
      { new: true } // This option ensures the updated user is returned
    );

    // If findOneAndUpdate returns null, it means no user was found
    if (!user) {
      return res.status(404).json({ message: "This email is not registered with us." });
    }

    await sendVerificationMail(email, otp);
    res.status(200).json({ message: "otp sent to your email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 500, message: "server error" });
  }
}
function verifyEmail() {}
module.exports = { register, requestVerification, verifyEmail };
