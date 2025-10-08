const userSchema = require("../model/userSchema");
const bcrypt = require("bcrypt");
const sendVerificationMail = require("../helpers/sendVerificationMail");
const crypto = require("crypto");
const regex = require("../helpers/regex");
const trimString = require("../helpers/trimString");
const jwt = require("jsonwebtoken");
const validatreRegisterInput = require("../helpers/validateRegisterInput");
const sendResponse = require("../helpers/sendResponse");

/*

*✅ Success
200 OK        → Successful fetch/update/delete
201 Created   → New resource/document created
204 No Content→ Success, nothing to return (e.g. delete)

!⚠️ Client Errors
400 Bad Request → Invalid input / missing fields / expired OTP
401 Unauthorized → No or invalid auth (JWT, session, etc.)
403 Forbidden   → Authenticated but not allowed / account locked
404 Not Found   → Document or resource doesn’t exist
409 Conflict    → Duplicate entry (unique field like email)
429 Too Many Requests → Rate limit exceeded (e.g. OTP/email spam)

!❌ Server Errors
500 Internal Server Error → Unexpected bug / DB error
502 Bad Gateway           → Server got invalid response (upstream/downstream issue)
503 Service Unavailable   → DB down / service temporarily overloaded
504 Gateway Timeout       → DB or external service took too long

jwt => header payload signature
*/
async function register(req, res) {
  let { firstName, lastName, email, password } = req.body;
  // trim and normalize email for db
  [firstName, lastName, email] = [firstName, lastName, email].map(trimString);
  email = email.toLowerCase();

  const errors = validatreRegisterInput({ firstName, lastName, email, password });
  // if any validation errors, return all at once
  if (Object.keys(errors).length > 0) {
    return sendResponse(res, {
      success: false,
      message: "Validation failed",
      status: 400,
      errors,
    });
  }

  try {
    const existUser = await userSchema.findOne({ email });
    if (existUser) return res.status(400).json({ success: false, message: "Email already exist" });

    const user = new userSchema({
      firstName,
      lastName,
      email,
      password,
    });
    await user.save();

    // conver schema to plain object
    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({ success: true, message: "Registration successfull", data: userData });
  } catch (err) {
    console.error(err);

    if (err.code === 11000 && err.keyPattern.email)
      return res.status(400).json({ success: false, message: "Email already exists" });
    res.status(500).json({ success: false, status: 500, message: "server error" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  // trim and normalize email for db
  [firstName, lastName, email] = [firstName, lastName, email].map(trimString);
  email = email.toLowerCase();

  if (!email) {
    return res.status(400).json({ success: false, message: "email is required" });
  } else if (!regex.isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email address" });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: "password is required" });
  }

  try {
    // Include password field (hidden by default) so we can compare it with hashed version
    const user = await userSchema.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "This email is not registered with us." });

    if (!user.verified) {
      return res.status(401).json({ success: false, message: "Email is not verified.Please verify your email." });
    }

    const isMatch = await userSchema.method.comparePassword(password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Wrong password" });

    // generate JWT
    const payload = { userId: user._id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" });

    // prepare object without password
    const userData = user.toObject();
    delete userData.password;
    // set cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // set secure flag in production
      sameSite: "Strict", // CSRF protection
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ success: true, message: "Login successful", data: userData });
  } catch (err) {
    res.status(500).json({ success: false, status: 500, message: "server error" });
  }
}

async function requestVerification(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: "email is required" });
  } else if (!regex.isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email address" });
  }
  try {
    // check attempts and lock if necessary
    const existingUser = await userSchema.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "This email is not registered with us." });
    }
    // just to be safe (400 => bad request)
    if (existingUser.verified) {
      return res.status(400).json({ success: false, message: "This email is already verified" });
    }
    if (existingUser.lastOtpRequest && existingUser.lastOtpRequest.getTime() > Date.now() - 60000) {
      // 429 - too many requests
      return res.status(429).json({ success: false, message: "You can request a new OTP only after 1 minute." });
    }
    if (existingUser.lockedUntil && existingUser.lockedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account is locked. Try again after ${Math.ceil(
          (existingUser.lockedUntil - new Date()) / 60000
        )} minutes.`,
      });
    }

    // generate 6 digit otp - string
    const otp = crypto.randomInt(100000, 999999).toString();
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
    res.status(200).json({ success: true, message: "otp sent to your email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, status: 500, message: "server error" });
  }
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "email and otp are required" });
  }

  try {
    const user = await userSchema.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "This email is not registered with us." });
    }
    // just to be safe (400 => bad request)
    if (user.verified) {
      return res.status(400).json({ success: false, message: "This email is already verified" });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account is locked. Try again after ${Math.ceil((user.lockedUntil - new Date()) / 60000)} minutes.`,
      });
    }
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: "Please request a new OTP." });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      user.otpAttempts += 1;
      // lock if attempts exceed 3
      if (user.otpAttempts >= 3) {
        user.lockedUntil = new Date(Date.now() + 10 * 60000); // lock for 10 minutes
      }

      await user.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // successful verification
    await userSchema.findOneAndUpdate(
      { email },
      {
        $set: {
          verified: true,
          otpAttempts: 0,
        },
        $unset: { otp: "", otpExpiry: "", lockedUntil: "", lastOtpRequest: "" },
      }
    );

    res.status(200).json({ success: true, message: "User verified successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, status: 500, message: "server error" });
  }
}
module.exports = { register, login, requestVerification, verifyEmail };
