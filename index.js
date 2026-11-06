const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

dotenv.config();

// Initialize DB connection & run seeder
connectDB().then(() => {
  seedDatabase();
});

const PORT = process.env.PORT || 10000;

// Models
const User = require("./models/User");
const donate = require("./models/donate");
const contact = require("./models/contact");

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const donorRoutes = require("./routes/donorRoutes");
const contentRoutes = require("./routes/contentRoutes");
const authController = require("./controllers/authController");
const donorController = require("./controllers/donorController");
const seedDatabase = require("./config/seedData");

const app = express();

// Middleware
app.use(
  cors({
    origin: true, // Allow frontend dev server and production clients
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Donation Management API is running securely.",
    version: "2.0.0",
    status: "Healthy",
  });
});

// Mount Modern REST APIs
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api", contentRoutes);

// --- Backward-Compatible Routes (Upgraded with Security) ---

// POST /signup -> Secure registration with bcrypt & JWT
app.post("/signup", authController.register);

// POST /login -> Secure login with password verification
app.post("/login", authController.login);

// Legacy GET /login -> Informative security message, NEVER leak user DB!
app.get("/login", (req, res) => {
  res.status(405).json({
    success: false,
    message:
      "Direct GET /login is disabled for security reasons. Please authenticate via POST /login or POST /api/auth/login.",
  });
});

// Legacy GET /search -> Delegate to secure donor search (sanitized fields only)
app.get("/search", donorController.searchDonors);

// POST /donate -> Handle donation creation with senior-level validation
app.post("/donate", async (req, res) => {
  try {
    const { amount, currency, mail, name, blood, mobile, pincode, paytype, address, country, birth, gender } = req.body;

    if (!amount || Number(amount) <= 0 || isNaN(Number(amount))) {
      return res.status(400).json({
        success: false,
        message: "A valid positive contribution amount is required.",
      });
    }

    if (!mail || !name || !blood || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Donor name, email address, blood group, and mobile number are required.",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(String(mail).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const donation = await donate.create({
      currency: currency || "INR",
      amount: Number(amount),
      paytype: paytype || "UPI",
      mail: String(mail).trim().toLowerCase(),
      name: String(name).trim(),
      blood: String(blood).trim().toUpperCase(),
      mobile: Number(mobile),
      birth: birth || "Not specified",
      gender: gender || "Not specified",
      address: address ? String(address).trim() : "Not specified",
      country: country ? String(country).trim() : "India",
      pincode: Number(pincode) || 0,
      userId: req.body.userId || undefined,
    });

    res.status(201).json({
      success: true,
      message: "Donation record saved successfully!",
      donation,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error saving donation record.",
      error: err.message,
    });
  }
});

// POST /contactus -> Save contact query with validation
app.post("/contactus", async (req, res) => {
  try {
    const { name, mail, subject, msg } = req.body;
    if (!name || !mail || !subject || !msg) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, subject, message) are required.",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(String(mail).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const contactus = await contact.create({
      name: String(name).trim(),
      mail: String(mail).trim().toLowerCase(),
      subject: String(subject).trim(),
      msg: String(msg).trim(),
    });

    res.status(201).json({
      success: true,
      message: "Contact inquiry saved successfully!",
      contactus,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error saving inquiry.",
      error: err.message,
    });
  }
});

// GET /amount -> Return all donations
app.get("/amount", async (req, res) => {
  try {
    const result = await donate.find();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching donation amounts" });
  }
});

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route '${req.originalUrl}' not found on this server.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server Global Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected error occurred on the server.",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running securely on PORT ${PORT} and DB is Connected`);
});