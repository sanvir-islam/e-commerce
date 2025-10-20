const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || `Something went wrong.`;

  // (only in development)
  if (statusCode === 500 && process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    statusCode = 404;
    message = `Resource not found with id: ${err.value}`;
  }

  // 2. Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    statusCode = 409;
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
  }

  // 3. Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    statusCode = 400;
    message = `Invalid input data: ${messages.join(", ")}`;
  }

  // 4. JWT Invalid Token
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please login again.";
  }

  // 5. JWT Expired Token
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your token has expired. Please login again.";
  }

  // 6. Bcrypt Hash Error
  if (err.message && err.message.includes("bcrypt")) {
    statusCode = 500;
    message = "Password processing error. Please try again.";
  }

  // 7. File Too Large
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File size too large. Maximum size is 5MB.";
  }

  // 8. Invalid File Type
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Invalid file type. Only images are allowed.";
  }

  // 9. OTP Related Errors
  if (err.message && err.message.includes("OTP")) {
    statusCode = err.statusCode || 400;
  }

  // 10. Account Locked Error
  if (err.message && err.message.includes("locked")) {
    statusCode = 403;
  }

  // 11. Email Not Verified
  if (err.message && err.message.includes("verify your email")) {
    statusCode = 403;
  }

  // 12. MongoDB Connection Error
  if (err.name === "MongoNetworkError" || err.name === "MongooseServerSelectionError") {
    statusCode = 503;
    message = "Database connection failed. Please try again later.";
  }

  // 13. Too Many Requests
  if (statusCode === 429) {
    message = err.message || "Too many requests. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    // Include error details only in development
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack, // where error occurred
    }),
  });
};

module.exports = errorHandler;
