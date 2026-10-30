const User = require("../models/User");
const Donate = require("../models/donate");
const Contact = require("../models/contact");

/**
 * Get all users with search, role filter, and pagination
 */
const getAllUsers = async (req, res) => {
  try {
    const { search = "", role = "", page = 1, limit = 20 } = req.query;

    const query = {};

    if (role && ["user", "donor", "admin"].includes(role)) {
      query.role = role;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { mail: searchRegex },
        { blood: searchRegex },
        { country: searchRegex },
        { address: searchRegex },
      ];
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNumber - 1) * pageSize;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Admin GetAllUsers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user list.",
      error: error.message,
    });
  }
};

/**
 * Update user role (admin, donor, user)
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "donor", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Must be 'user', 'donor', or 'admin'.",
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Edge Case: Prevent the last remaining admin from demoting themselves!
    if (targetUser._id.equals(req.userId) && targetUser.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote yourself. You are the only active administrator in the system.",
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User role successfully updated to '${role}'.`,
      user: targetUser,
    });
  } catch (error) {
    console.error("Admin UpdateRole Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating user role.",
      error: error.message,
    });
  }
};

/**
 * Toggle user active/inactive status
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Edge Case: Admin cannot deactivate their own account
    if (targetUser._id.equals(req.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User account has been ${targetUser.isActive ? "activated" : "deactivated"}.`,
      isActive: targetUser.isActive,
    });
  } catch (error) {
    console.error("Admin ToggleStatus Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error toggling user status.",
      error: error.message,
    });
  }
};

/**
 * Get system-wide metrics and stats for admin dashboard
 */
const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalDonors,
      activeUsers,
      donations,
      contactCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "donor" }),
      User.countDocuments({ isActive: true }),
      Donate.find(),
      Contact.countDocuments(),
    ]);

    const totalDonationAmount = donations.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );

    // Group blood types for chart / inventory overview
    const bloodCounts = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$blood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalDonors,
        activeUsers,
        totalDonationRecords: donations.length,
        totalDonationAmount,
        contactInquiries: contactCount,
        bloodInventorySummary: bloodCounts,
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching system statistics.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAdminDashboardStats,
};

