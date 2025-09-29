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
    // check attempts and lock if necessary
    const existingUser = await userSchema.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "This email is not registered with us." });
    }
    // just to be safe (400 => bad request)
    if (existingUser.verified) {
      return res.status(400).json({ message: "This email is already verified" });
    }
    if (lastOtpRequest < Date.now() - 60000) {
      // 429 - too many requests
      return res.status(429).json({ message: "You can request a new OTP only after 1 minute." });
    }
    if (existingUser.lockedUntil && existingUser.lockedUntil > new Date()) {
      return res.status(403).json({
        message: `Account is locked. Try again after ${Math.ceil(
          (existingUser.lockedUntil - new Date()) / 60000
        )} minutes.`,
      });
    }

    // generate 6 digit otp
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
      digits: true,
    });
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Expiry = 2min
    const otpExpiry = new Date(Date.now() + 2 * 60 * 1000);
    // update in DB
    await userSchema.findOneAndUpdate(
      { email: email },
      {
        otp: hashedOTP, // The new hashed OTP
        otpExpiry,
        lastOtpRequest: new Date(),
        lockedUntil: null,
      },
      { new: true } // return updated doc
    );

    // send email
    await sendVerificationMail(email, otp);
    res.status(200).json({ message: "otp sent to your email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 500, message: "server error" });
  }
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "email is required" });
  }

  try {
    const user = await userSchema.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "This email is not registered with us." });
    }
    // just to be safe (400 => bad request)
    if (user.verified) {
      return res.status(400).json({ message: "This email is already verified" });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        message: `Account is locked. Try again after ${Math.ceil((user.lockedUntil - new Date()) / 60000)} minutes.`,
      });
    }
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ message: "Please request a new OTP." });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;

      // lock if attempts exceed 3
      if (user.otpAttempts >= 3) {
        user.lockedUntil = new Date(Date.now() + 10 * 60000); // lock for 10 minutes
      }

      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // successful verification
    await userSchema.findOneAndUpdate(
      { email },
      {
        $set: {
          otpAttempts: 0,
          verified: true,
        },
        $unset: { otp: "", otpExpiry: "", lockedUntil: "" },
      }
    );

    res.status(200).json({ message: "User verified successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ status: 500, message: "server error" });
  }
}
module.exports = { register, requestVerification, verifyEmail };
