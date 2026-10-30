const mongoose = require("mongoose");

const connectDB = async () => {
  let url = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/Donation";

  // Sanitize URI: if brackets like <username> or <password> were left, remove them cleanly
  url = url.replace(/<([^>]+)>/g, "$1");

  try {
    await mongoose.connect(url, {
      dbName: "Donation",
      serverSelectionTimeoutMS: 8000,
    });
    console.log("Connected to MongoDB Atlas (Donation DB) Successfully!");
  } catch (err) {
    console.error("MongoDB Atlas Connection Error:", err.message);
  }
};

module.exports = connectDB;
