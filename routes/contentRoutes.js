const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

router.get("/emergency-requests", contentController.getEmergencyRequests);
router.get("/campaigns", contentController.getCampaigns);
router.get("/articles", contentController.getArticles);
router.get("/faqs", contentController.getFaqs);
router.get("/testimonials", contentController.getTestimonials);
router.get("/stats/public", contentController.getPublicStats);

module.exports = router;

