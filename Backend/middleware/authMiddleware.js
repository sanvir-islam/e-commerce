const jwt = require("jsonwebtoken");

exports.verifyAuthToken = async (req, res, next) => {
  try {
    // const token = req.headers.authorization?.split(" ").at(-1) || req.headers.cookie?.split("=").at(-1); //cookie = "accessToken=cookie"
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(req.user);
    if (req.user && req.user.id !== decoded.userId) {
      return res.status(403).json({
        success: false,
        message: "Token does not match the user. Login again.",
      });
    }

    req.user = decoded;

    next();
  } catch (err) {
    const errorMsg =
      err.name === "TokenExpiredError"
        ? "Token expired. Please login again."
        : err.name === "JsonWebTokenError"
        ? "Invalid token"
        : "Authentication error";

    res.status(errorMsg === "Authentication error" ? 500 : 401).json({
      success: false,
      message: errorMsg,
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};

exports.requiredRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    next();
  };
};
