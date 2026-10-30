const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Connection handled centrally via config/db.js

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    mail: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Never return password in normal queries
    },
    role: {
      type: String,
      enum: {
        values: ["user", "donor", "admin"],
        message: "{VALUE} is not a valid role",
      },
      default: "user",
    },
    blood: {
      type: String,
      required: [true, "Blood type is required"],
      trim: true,
      uppercase: true,
    },
    mobile: {
      type: Number,
      required: [true, "Mobile number is required"],
      unique: true,
    },
    birth: {
      type: String,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    pincode: {
      type: Number,
      required: [true, "Pincode is required"],
    },
    isAvailableForDonation: {
      type: Boolean,
      default: true,
    },
    lastDonationDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified or new
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Only hash if it's not already a bcrypt hash (e.g. from legacy migration)
  if (!this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Instance method to compare password (with legacy plain-text auto-migration)
userSchema.methods.comparePassword = async function (candidatePassword) {
  // If stored password is a bcrypt hash
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Edge case: Legacy unhashed password migration
  if (this.password === candidatePassword) {
    // Upgrade to bcrypt hash automatically in the background
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(candidatePassword, salt);
    try {
      await this.save();
    } catch (saveErr) {
      console.warn("Could not immediately persist upgraded password hash:", saveErr.message);
    }
    return true;
  }

  return false;
};

// Instance method to generate JWT
userSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || "default_donation_secret_key_change_in_production";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: this._id,
      mail: this.mail,
      name: this.name,
      role: this.role,
    },
    secret,
    { expiresIn }
  );
};

// Never leak password in JSON outputs
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Collection name "signup" keeps compatibility with existing MongoDB collection
module.exports = mongoose.model("signup", userSchema, "signup");
