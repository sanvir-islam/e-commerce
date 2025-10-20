const express = require("express");
const router = express.Router();
// limiter - set req per ip in window time
const { register, requestVerification, login, verifyEmail, logout } = require("../../controller/authController");
const {
  registerValidation,
  loginValidation,
  emailValidation,
  otpValidation,
} = require("../../middleware/validationMiddleware");
const { loginRateLimiter, registerRateLimiter, otpRateLimiter } = require("../../middleware/rateLimiter");
const { verifyAuthToken } = require("../../middleware/authMiddleware");
const { asyncHandler } = require("../../middleware/asyncHandler");

//---------------------

router.post("/register", registerValidation, registerRateLimiter, asyncHandler(register));
router.post("/login", loginValidation, loginRateLimiter, login);
router.post("/request-verification", emailValidation, otpRateLimiter, asyncHandler(requestVerification));
router.post("/verify-email", emailValidation, otpValidation, asyncHandler(verifyEmail));
router.post("/logout", verifyAuthToken, asyncHandler(logout));

module.exports = router;
