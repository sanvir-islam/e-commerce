// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");
// For registration - prevent spam accounts
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1hr
  max: 3,
  message: {
    success: false,
    message: "Too many accounts created. Please try again later.",
  },
});
// For login attempts - prevent password guessing
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 5,
  skipSuccessfulRequests: true, //only counts failed logins
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true, // send rate limit info in headers
  legacyHeaders: false,
});

// For OTP requests - prevent email bombing
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again in 15 minutes.",
  },
});

// For password reset - very sensitive
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 reset requests per hour
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again in 1 hour.",
  },
});

// For cart operations - prevent cart spam
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 cart operations per minute
  message: {
    success: false,
    message: "Too many cart operations. Please slow down.",
  },
});

// For order creation - prevent fake orders
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 orders per hour
  message: {
    success: false,
    message: "Too many orders. Please contact support if you need help.",
  },
});

// ============================================
// 4. SEARCH/BROWSE LIMITERS
// ============================================

// For product search - prevent DB overload
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    success: false,
    message: "Too many search requests. Please wait a moment.",
  },
});

// General API access - base protection
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute (generous)
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

// ============================================
// 5. ADMIN LIMITERS
// ============================================

// For admin operations - prevent abuse
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 admin operations per minute
  message: {
    success: false,
    message: "Too many admin operations. Please slow down.",
  },
});

module.exports = {
  // Auth
  loginRateLimiter,
  registerRateLimiter,

  // OTP/ResetPass - Email
  otpRateLimiter,
  passwordResetRateLimiter,

  // Shopping
  cartLimiter,
  orderLimiter,

  // Browse
  searchLimiter,
  apiLimiter,

  // Admin
  adminLimiter,
};
