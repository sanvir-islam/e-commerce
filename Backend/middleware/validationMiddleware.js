const trimString = require("../helpers/trimString");
const regex = require("../helpers/regex");
const validateRegistrationInput = require("../helpers/validateRegistrationInput");

exports.registerValidation = (req, res, next) => {
  let { firstName, lastName, email, password } = req.body;

  // validate inputs
  const errors = validateRegistrationInput({ firstName, lastName, email, password });
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // trim and normalize fields for db
  [firstName, lastName, email] = [firstName, lastName, email].map(trimString);
  email = email.toLowerCase();

  req.body.firstName = firstName;
  req.body.lastName = lastName;
  req.body.email = email;

  next();
};

exports.loginValidation = (req, res, next) => {
  let { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
  // after confirming email existance
  email = trimString(email).toLowerCase();

  if (!regex.isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  req.body.email = email;

  next();
};

exports.emailValidation = (req, res, next) => {
  let { email } = req.body;
  if (!email)
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });

  email = trimString(email).toLowerCase();

  if (!regex.isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  req.body.email = email;

  next();
};

exports.otpValidation = (req, res, next) => {
  let { otp } = req.body;
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: "OTP is required",
    });
  }

  otp = trimString(otp);

  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "OTP must be a 6-digit number",
    });
  }
  req.body.otp = otp;

  next();
};
