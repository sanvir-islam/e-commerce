const express = require("express");
const router = express.Router();
// limiter - set req per ip in window time
const {
  registerController,
  requestVerificationController,
  loginController,
  verifyEmailController,
  logoutController,
} = require("../../controller/authController");
const {
  registerValidation,
  loginValidation,
  emailValidation,
  otpValidation,
} = require("../../middleware/validationMiddleware");
const { loginRateLimiter, registerRateLimiter, otpRateLimiter } = require("../../middleware/rateLimiter");
const { verifyAuthToken } = require("../../middleware/authMiddleware");

//---------------------

router.post("/register", registerValidation, registerRateLimiter, registerController);
router.post("/login", loginValidation, loginRateLimiter, loginController);
router.post("/request-verification", emailValidation, otpRateLimiter, requestVerificationController);
router.post("/verify-email", emailValidation, otpValidation, verifyEmailController);
router.post("/logout", verifyAuthToken, logoutController);

module.exports = router;
