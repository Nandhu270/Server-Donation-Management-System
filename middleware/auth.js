const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to verify JWT token and authenticate user
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check httpOnly cookie first (secure client-side authentication)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization header (case-insensitive check)
    else if (req.headers) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1].trim();
      } else if (req.query && req.query.token) {
        token = req.query.token;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication token missing.",
      });
    }

    const secret = process.env.JWT_SECRET || "default_donation_secret_key_change_in_production";
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Session expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid authentication token.",
      });
    }

    // Verify user exists in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account for this token no longer exists.",
      });
    }

    // Edge case: account disabled/banned
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Attach user and decoded metadata to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
    });
  }
};

/**
 * Middleware to require specific role(s)
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'donor')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of the following roles: [${roles.join(", ")}]. Current role: '${req.user.role}'.`,
      });
    }

    next();
  };
};

// Convenience helper for Admin only
const requireAdmin = requireRole("admin");

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
};

