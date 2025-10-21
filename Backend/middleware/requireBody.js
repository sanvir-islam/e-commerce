module.exports = (req, res, next) => {
  // Only check for mutation methods (methods that send data)
  const mutationMethods = ["POST", "PUT", "PATCH"];

  if (mutationMethods.includes(req.method)) {
    // Check if body is undefined or null
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing. Please send data in JSON format",
      });
    }

    // Check if body is empty object
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty",
      });
    }
  }

  next();
};
