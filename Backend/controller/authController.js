const userSchema = require("../model/userSchema");
const bcrypt = require("bcrypt");
const sendVerificationMail = require("../helpers/sendVerificationMail");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const createError = require("../helpers/createError");
const path = require("path");

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
  const { firstName, lastName, email, password } = req.body;
  const existingUser = await userSchema.findOne({ email });
  if (existingUser) throw createError(409, "Email is already registered");

  const user = new userSchema({
    firstName,
    lastName,
    email,
    password,
  });
  await user.save();

  res.status(201).json({ success: true, message: "Account created! Check your email to verify.", data: user });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await userSchema.findOne({ email, isActive: true }).select("+password");
  if (!user) throw createError(404, "This email is not registered with us.", "login");
  if (!user.verified) throw createError(401, "Please verify your email before logging in", "login");

  // run comparePassword method from userSchema
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw createError(400, "Invalid email or password", "login");

  // update last login
  user.lastLogin = new Date();
  await user.save();

  // generate JWT
  const payload = { userId: user._id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1h" });

  // set cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // set secure flag in production
    sameSite: "Strict", // CSRF protection
    maxAge: 3600000, // 1 hour
  });

  res.status(200).json({ success: true, message: "Login successful", data: user });
}

async function requestVerification(req, res) {
  const { email } = req.body;

  const user = await userSchema.findOne({ email }).select("+otp +otpExpiry +lastOtpRequest +lockedUntil");
  if (!user) throw createError(404, "Email is not registered", "request OTP verification");
  if (user.verified) throw createError(400, "This email is already verified", "request OTP verification");
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw createError(
      403,
      `Account is locked. Try again after ${Math.ceil((user.lockedUntil - new Date()) / 60000)} minutes.`,
      "request OTP verification"
    );
  }
  // 1min cooldown
  if (user.lastOtpRequest) {
    const timeSinceLastRequest = (Date.now() - user.lastOtpRequest.getTime()) / 1000; // in sec
    // 429 - too many requests
    if (timeSinceLastRequest < 60) {
      throw createError(
        429,
        `Please wait ${60 - Math.floor(timeSinceLastRequest)} second${
          timeSinceLastRequest > 1 ? "s" : ""
        } before requesting a new OTP`,
        "request OTP verification"
      );
    }
  }

  // generate 6 digit otp - string
  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); //2 min

  // update in DB
  user.otp = hashedOTP;
  user.otpExpiry = otpExpiry;
  user.lastOtpRequest = new Date();
  user.lockedUntil = undefined;
  user.otpAttempts = 0;
  await user.save();

  // send email
  await sendVerificationMail(email, otp);
  res.status(200).json({ success: true, message: "OTP sent to your email. Valid for 2 minutes." });
}

async function verifyEmail(req, res) {
  const { email, otp } = req.body;

  const user = await userSchema.findOne({ email }).select("+otp +otpExpiry +otpAttempts +lockedUntil ");
  if (!user) throw createError(404, "Email is not registered", "verify OTP.");
  if (user.verified) throw createError(400, "This email is already verified", "verify OTP.");
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
    // 403 -> forbidden
    throw createError(403, `Account is locked. Try again after ${minLeft} minutes.`, "verify OTP.");
  }
  if (!user.otp || !user.otpExpiry) {
    throw createError(400, "No OTP found. Please request a new one.", "verify OTP.");
  }
  if (user.otpExpiry < new Date()) throw createError(400, "OTP expired. Please request a new one.", "verify OTP.");

  const isMatch = await bcrypt.compare(otp, user.otp);
  if (!isMatch) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    const attemptsLeft = 3 - user.otpAttempts;

    // lock after 3 failed attempt
    if (user.otpAttempts >= 3) {
      user.lockedUntil = new Date(Date.now() + 10 * 60 * 1000); // lock for 10 minutes
      user.otpAttempts = 0;
      user.otp = undefined;
      user.otpExpiry = undefined;
    }
    user.save();

    throw createError(400, `Invalid OTP. ${attemptsLeft > 0 ? attemptsLeft : "No"} attempts remaining`, "verify OTP.");
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

  res.status(200).json({ success: true, message: "User verified successfully. You can now login." });
}

async function logout(req, res) {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

module.exports = {
  register,
  login,
  requestVerification,
  verifyEmail,
  logout,
};
