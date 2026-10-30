const express = require("express");
const router = express.Router();
const donorController = require("../controllers/donorController");

// Public donor search (sanitized)
router.get("/search", donorController.searchDonors);

module.exports = router;

