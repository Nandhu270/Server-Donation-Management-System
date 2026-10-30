const User = require("../models/User");
const Donate = require("../models/donate");
const bcrypt = require("bcryptjs");

/**
 * Configure secure httpOnly cookie options
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // Prevents client-side scripts from reading the cookie (protects from XSS)
    secure: isProduction, // HTTPS only in production environments
    sameSite: isProduction ? "none" : "lax", // 'lax' for local dev, 'none' for production cross-site
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/",
  };
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    const {
      name,
      mail,
      password,
      blood,
      mobile,
      birth,
      gender,
      address,
      country,
      pincode,
      role: requestedRole,
    } = req.body;

    // Validate required fields
    if (!name || !mail || !password || !blood || !mobile || !birth || !gender || !address || !country || !pincode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const normalizedEmail = mail.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Password strength check: at least 6 chars, letters, numbers, and special characters
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long and contain letters, numbers, and special characters.",
      });
    }

    // Mobile validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(String(mobile).trim())) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be a valid 10-digit number.",
      });
    }

    // Pincode validation
    const pinRegex = /^[0-9]{3,10}$/;
    if (!pinRegex.test(String(pincode).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid pincode.",
      });
    }

    // Check if email already exists
    const existingUserByMail = await User.findOne({ mail: normalizedEmail });
    if (existingUserByMail) {
      return res.status(409).json({
        success: false,
        field: "mail",
        message: "This email address is already registered. Please log in or use another email.",
      });
    }

    // Check if mobile phone number already exists
    const existingUserByMobile = await User.findOne({ mobile: Number(mobile) });
    if (existingUserByMobile) {
      return res.status(409).json({
        success: false,
        field: "mobile",
        message: `The mobile number ${mobile} is already registered to another account. Please use your own phone number or log in.`,
      });
    }

    // Determine Role:
    // Security Edge Case: Prevent normal users from self-promoting to admin via request body.
    let role = "user";
    if (requestedRole === "donor") {
      role = "donor";
    }

    // If matches configured ADMIN_EMAIL or system currently has 0 users, auto-grant admin
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const userCount = await User.countDocuments();
    if ((adminEmail && normalizedEmail === adminEmail) || userCount === 0) {
      role = "admin";
    }

    // Create user
    const newUser = new User({
      name: name.trim(),
      mail: normalizedEmail,
      password, // Pre-save hook hashes this with bcrypt
      blood: blood.trim().toUpperCase(),
      mobile: Number(mobile),
      birth,
      gender,
      address: address.trim(),
      country: country.trim(),
      pincode: Number(pincode),
      role,
      isAvailableForDonation: true,
      isActive: true,
    });

    await newUser.save();

    // Generate JWT token
    const token = newUser.generateAuthToken();

    // Set secure httpOnly cookie on response
    res.cookie("token", token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Register Error:", error);

    // Handle MongoDB unique index constraint collision (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
      const isMobile = field === "mobile";
      const isMail = field === "mail";
      const msg = isMobile
        ? `The mobile number ${error.keyValue?.mobile || ""} is already registered to another user.`
        : isMail
        ? `The email ${error.keyValue?.mail || ""} is already registered.`
        : `A user with this ${field} already exists.`;

      return res.status(409).json({
        success: false,
        field: isMobile ? "mobile" : isMail ? "mail" : field,
        message: msg,
      });
    }

    return res.status(500).json({
      success: false,
      message: "An error occurred while creating your account. Please try again.",
      error: error.message,
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { mail, password } = req.body;

    if (!mail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = mail.trim().toLowerCase();

    // Find user by email and explicitly select password
    const user = await User.findOne({ mail: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if account is active
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Verify password (handles bcrypt compare and legacy plain-text auto-migration)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Auto-promote to admin if matching ADMIN_EMAIL
    const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (adminEmail && user.mail === adminEmail && user.role !== "admin") {
      user.role = "admin";
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = user.generateAuthToken();

    // Set secure httpOnly cookie on response
    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      token,
      user,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during login. Please try again.",
      error: error.message,
    });
  }
};

/**
 * Get current authenticated user's profile
 */
const getMe = async (req, res) => {
  try {
    // req.user is attached by verifyToken middleware
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user profile.",
    });
  }
};

/**
 * Update current user's profile
 */
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, mobile, address, country, pincode, blood, gender, isAvailableForDonation } = req.body;

    if (name) user.name = name.trim();
    if (mobile) {
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(String(mobile).trim())) {
        return res.status(400).json({ success: false, message: "Invalid 10-digit mobile number." });
      }
      const numMobile = Number(mobile);
      if (numMobile !== user.mobile) {
        const inUse = await User.findOne({ mobile: numMobile, _id: { $ne: user._id } });
        if (inUse) {
          return res.status(409).json({
            success: false,
            field: "mobile",
            message: `The mobile number ${mobile} is already registered to another account.`,
          });
        }
      }
      user.mobile = numMobile;
    }
    if (address) user.address = address.trim();
    if (country) user.country = country.trim();
    if (pincode) {
      const pinRegex = /^[0-9]{3,10}$/;
      if (!pinRegex.test(String(pincode).trim())) {
        return res.status(400).json({ success: false, message: "Invalid pincode." });
      }
      user.pincode = Number(pincode);
    }
    if (blood) user.blood = blood.trim().toUpperCase();
    if (gender) user.gender = gender;
    if (typeof isAvailableForDonation === "boolean") {
      user.isAvailableForDonation = isAvailableForDonation;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating profile.",
      error: error.message,
    });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation password do not match.",
      });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long and contain letters, numbers, and special characters.",
      });
    }

    // Need user with password selected
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password.",
      });
    }

    // Set new password (pre-save hook will hash it with bcrypt)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error changing password.",
      error: error.message,
    });
  }
};

/**
 * Get donation statistics for the logged-in user
 */
const getUserDonationStats = async (req, res) => {
  try {
    const userEmail = req.user.mail;
    const donations = await Donate.find({ mail: userEmail }).sort({ createdAt: -1 });

    const totalAmount = donations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return res.status(200).json({
      success: true,
      totalAmount,
      count: donations.length,
      donations,
    });
  } catch (error) {
    console.error("User Donation Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching donation history.",
    });
  }
};

/**
 * Logout user - securely clears httpOnly cookie
 */
const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during logout.",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  getUserDonationStats,
};

