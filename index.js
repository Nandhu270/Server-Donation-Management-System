const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

dotenv.config();

// Initialize DB connection
connectDB();

const PORT = process.env.PORT || 5174;

// Models
const User = require("./models/User");
const donate = require("./models/donate");
const contact = require("./models/contact");

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const donorRoutes = require("./routes/donorRoutes");
const authController = require("./controllers/authController");
const donorController = require("./controllers/donorController");

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

// POST /donate -> Handle donation creation
app.post("/donate", async (req, res) => {
  try {
    const donation = await donate.create(req.body);
    res.status(201).json({
      success: true,
      message: "Donation saved successfully!",
      donation,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error saving donation",
      error: err.message,
    });
  }
});

// POST /contactus -> Save contact query
app.post("/contactus", async (req, res) => {
  try {
    const contactus = await contact.create(req.body);
    res.status(201).json({
      success: true,
      message: "ContactUs saved successfully!",
      contactus,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error saving contactus",
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

app.listen(PORT, () => {
  console.log(`Server is running securely on PORT ${PORT}`);
});
