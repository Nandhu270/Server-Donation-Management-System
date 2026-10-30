const User = require("../models/User");

/**
 * Secure server-side donor search
 * Returns only sanitized public donor information (NEVER passwords or private data)
 */
const searchDonors = async (req, res) => {
  try {
    const { blood, country, pincode, availableOnly = "true" } = req.query;

    const query = { isActive: true };

    if (availableOnly === "true") {
      query.isAvailableForDonation = { $ne: false };
    }

    if (blood && blood.trim()) {
      // Normalize blood search term (match "A+", "A+ve", "O-ve", etc.)
      const cleaned = blood.trim().replace(/\s+/g, "");
      query.blood = new RegExp(`^${cleaned.replace("+ve", "\\+?").replace("-ve", "\\-?")}`, "i");
    }

    if (country && country.trim()) {
      query.country = new RegExp(country.trim(), "i");
    }

    if (pincode && pincode.trim()) {
      query.pincode = Number(pincode.trim()) || pincode.trim();
    }

    // Select ONLY safe, public donor fields
    const donors = await User.find(query)
      .select("_id name blood country pincode gender isAvailableForDonation mobile")
      .limit(50);

    return res.status(200).json({
      success: true,
      count: donors.length,
      donors,
    });
  } catch (error) {
    console.error("Search Donors Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching donors.",
      error: error.message,
    });
  }
};

module.exports = {
  searchDonors,
};

