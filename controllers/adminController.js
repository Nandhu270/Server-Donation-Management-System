const mongoose = require("mongoose");
const User = require("../models/User");
const Donate = require("../models/donate");
const Contact = require("../models/contact");
const EmergencyRequest = require("../models/EmergencyRequest");
const Campaign = require("../models/Campaign");
const Article = require("../models/Article");
const Faq = require("../models/Faq");
const Testimonial = require("../models/Testimonial");

// Helper: Validate MongoDB ObjectId
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: Escape Regex Special Characters
const escapeRegex = (string) => (string || "").replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

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

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { name: searchRegex },
        { mail: searchRegex },
        { blood: searchRegex },
        { country: searchRegex },
        { address: searchRegex },
      ];
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
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
        totalPages: Math.ceil(total / pageSize) || 1,
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

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user identifier format." });
    }

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

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user identifier format." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (targetUser._id.equals(req.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own administrator account.",
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
      emergencyCount,
      campaignCount,
      articleCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "donor" }),
      User.countDocuments({ isActive: true }),
      Donate.find(),
      Contact.countDocuments(),
      EmergencyRequest.countDocuments(),
      Campaign.countDocuments(),
      Article.countDocuments(),
    ]);

    const totalDonationAmount = donations.reduce(
      (sum, d) => sum + (Number(d.amount) || 0),
      0
    );

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
        emergencyRequests: emergencyCount,
        campaignsCount: campaignCount,
        articlesCount: articleCount,
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

// ==========================================
// EMERGENCY BLOOD REQUESTS MANAGEMENT
// ==========================================

const getAllEmergencyRequestsAdmin = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createEmergencyRequest = async (req, res) => {
  try {
    const { hospital, location, blood, patient, urgency, unitsRequired, contactPhone } = req.body;
    if (!hospital || !location || !blood || !patient) {
      return res.status(400).json({ success: false, message: "Hospital, location, blood, and patient are required." });
    }

    const units = Math.max(1, parseInt(unitsRequired, 10) || 1);

    const newRequest = await EmergencyRequest.create({
      hospital: String(hospital).trim(),
      location: String(location).trim(),
      blood: String(blood).trim().toUpperCase(),
      patient: String(patient).trim(),
      urgency: urgency || "Immediate",
      unitsRequired: units,
      contactPhone: contactPhone ? String(contactPhone).trim() : "+91 985-452-964",
      isActive: true,
    });

    return res.status(201).json({ success: true, message: "Emergency request created.", request: newRequest });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateEmergencyRequest = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request identifier format." });
    }

    const updated = await EmergencyRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Request not found." });
    return res.status(200).json({ success: true, message: "Emergency request updated.", request: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleEmergencyRequest = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request identifier format." });
    }

    const reqDoc = await EmergencyRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found." });
    reqDoc.isActive = !reqDoc.isActive;
    await reqDoc.save();
    return res.status(200).json({ success: true, message: "Status updated.", isActive: reqDoc.isActive });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEmergencyRequest = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request identifier format." });
    }

    const deleted = await EmergencyRequest.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Request not found." });
    return res.status(200).json({ success: true, message: "Emergency request deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// CAMPAIGNS / CAUSES MANAGEMENT
// ==========================================

const getAllCampaignsAdmin = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: campaigns.length, campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createCampaign = async (req, res) => {
  try {
    const { title, focus, image, goal, raised, beneficiaries, desc } = req.body;
    if (!title || !focus || !goal || !desc) {
      return res.status(400).json({ success: false, message: "Title, focus, goal, and description are required." });
    }

    const numericGoal = Number(goal);
    if (isNaN(numericGoal) || numericGoal <= 0) {
      return res.status(400).json({ success: false, message: "Goal must be a positive number." });
    }

    const campaign = await Campaign.create({
      title: String(title).trim(),
      focus: String(focus).trim(),
      image: image ? String(image).trim() : "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop",
      goal: numericGoal,
      raised: Math.max(0, Number(raised) || 0),
      beneficiaries: beneficiaries ? String(beneficiaries).trim() : "",
      desc: String(desc).trim(),
      isActive: true,
    });

    return res.status(201).json({ success: true, message: "Campaign created successfully.", campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateCampaign = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign identifier format." });
    }

    const updated = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Campaign not found." });
    return res.status(200).json({ success: true, message: "Campaign updated.", campaign: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid campaign identifier format." });
    }

    const deleted = await Campaign.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Campaign not found." });
    return res.status(200).json({ success: true, message: "Campaign deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ARTICLES MANAGEMENT
// ==========================================

const getAllArticlesAdmin = async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: articles.length, articles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, category, readTime, date, image, excerpt, content, link } = req.body;
    if (!title || !category || !excerpt) {
      return res.status(400).json({ success: false, message: "Title, category, and excerpt are required." });
    }

    const article = await Article.create({
      title: String(title).trim(),
      category: String(category).trim(),
      readTime: readTime ? String(readTime).trim() : "4 min read",
      date: date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      image: image ? String(image).trim() : "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop",
      excerpt: String(excerpt).trim(),
      content: content ? String(content).trim() : "",
      link: link || "/blog/blood",
      isPublished: true,
    });

    return res.status(201).json({ success: true, message: "Article created.", article });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateArticle = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid article identifier format." });
    }

    const updated = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Article not found." });
    return res.status(200).json({ success: true, message: "Article updated.", article: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid article identifier format." });
    }

    const deleted = await Article.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Article not found." });
    return res.status(200).json({ success: true, message: "Article deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// INQUIRIES & HELPLINE MANAGEMENT
// ==========================================

const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: inquiries.length, inquiries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteInquiry = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid inquiry identifier format." });
    }

    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Inquiry not found." });
    return res.status(200).json({ success: true, message: "Inquiry removed." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DONATION TRANSACTIONS LEDGER
// ==========================================

const getAllDonationsAdmin = async (req, res) => {
  try {
    const donations = await Donate.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: donations.length, donations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDonationAdmin = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid donation identifier format." });
    }

    const deleted = await Donate.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Donation record not found." });
    return res.status(200).json({ success: true, message: "Donation record deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// FAQS MANAGEMENT
// ==========================================

const getAllFaqsAdmin = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ order: 1, createdAt: 1 });
    return res.status(200).json({ success: true, count: faqs.length, faqs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createFaq = async (req, res) => {
  try {
    const { question, answer, category, order } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: "Question and answer are required." });
    }

    const faq = await Faq.create({
      question: String(question).trim(),
      answer: String(answer).trim(),
      category: category ? String(category).trim() : "General",
      order: Number(order) || 0,
      isActive: true,
    });

    return res.status(201).json({ success: true, message: "FAQ created.", faq });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateFaq = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid FAQ identifier format." });
    }

    const updated = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "FAQ not found." });
    return res.status(200).json({ success: true, message: "FAQ updated.", faq: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFaq = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid FAQ identifier format." });
    }

    const deleted = await Faq.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "FAQ not found." });
    return res.status(200).json({ success: true, message: "FAQ deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAdminDashboardStats,

  // Emergency Requests
  getAllEmergencyRequestsAdmin,
  createEmergencyRequest,
  updateEmergencyRequest,
  toggleEmergencyRequest,
  deleteEmergencyRequest,

  // Campaigns
  getAllCampaignsAdmin,
  createCampaign,
  updateCampaign,
  deleteCampaign,

  // Articles
  getAllArticlesAdmin,
  createArticle,
  updateArticle,
  deleteArticle,

  // Inquiries
  getAllInquiries,
  deleteInquiry,

  // Donations
  getAllDonationsAdmin,
  deleteDonationAdmin,

  // FAQs
  getAllFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
};
