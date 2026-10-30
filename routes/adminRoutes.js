const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// All admin routes strictly require valid JWT AND admin role
router.use(verifyToken, requireAdmin);

// Users Management
router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/status", adminController.toggleUserStatus);
router.get("/stats", adminController.getAdminDashboardStats);

// Emergency Requests Management
router.get("/emergency-requests", adminController.getAllEmergencyRequestsAdmin);
router.post("/emergency-requests", adminController.createEmergencyRequest);
router.put("/emergency-requests/:id", adminController.updateEmergencyRequest);
router.patch("/emergency-requests/:id/toggle", adminController.toggleEmergencyRequest);
router.delete("/emergency-requests/:id", adminController.deleteEmergencyRequest);

// Campaigns Management
router.get("/campaigns", adminController.getAllCampaignsAdmin);
router.post("/campaigns", adminController.createCampaign);
router.put("/campaigns/:id", adminController.updateCampaign);
router.delete("/campaigns/:id", adminController.deleteCampaign);

// Articles Management
router.get("/articles", adminController.getAllArticlesAdmin);
router.post("/articles", adminController.createArticle);
router.put("/articles/:id", adminController.updateArticle);
router.delete("/articles/:id", adminController.deleteArticle);

// Inquiries Desk
router.get("/inquiries", adminController.getAllInquiries);
router.delete("/inquiries/:id", adminController.deleteInquiry);

// Donations Ledger
router.get("/donations", adminController.getAllDonationsAdmin);
router.delete("/donations/:id", adminController.deleteDonationAdmin);

// FAQs Management
router.get("/faqs", adminController.getAllFaqsAdmin);
router.post("/faqs", adminController.createFaq);
router.put("/faqs/:id", adminController.updateFaq);
router.delete("/faqs/:id", adminController.deleteFaq);

module.exports = router;
