const {
  validateRegistration,
  validateLogin,
  validateEmail,
  validateOTP,
} = require("../helpers/validators/userValidator");

exports.registerValidation = (req, res, next) => {
  const { errors, hasError, sanitizedData } = validateRegistration(req.body);
  if (hasError) {
    return res.status(400).json({
      success: false,
      message: "Input validation failed",
      errors,
    });
  }

  req.body = sanitizedData;
  next();
};
exports.loginValidation = (req, res, next) => {
  const { errors, hasError, sanitizedData } = validateLogin(req.body);
  if (hasError) {
    return res.status(400).json({
      success: false,
      message: "Input validation failed",
      errors,
    });
  }

  req.body = sanitizedData;
  next();
};

exports.emailValidation = (req, res, next) => {
  const { error, hasError, sanitizedEmail } = validateEmail(req.body.email);
  if (hasError) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }

  req.body.email = sanitizedEmail;
  next();
};
exports.otpValidation = (req, res, next) => {
  const { error, hasError, sanitizedOTP } = validateOTP(req.body.otp);
  if (hasError) {
    return res.status(400).json({
      success: false,
      message: error,
    });
  }

  req.body.otp = sanitizedOTP;
  next();
};
