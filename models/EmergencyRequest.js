const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
  {
    hospital: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    blood: { type: String, required: true, trim: true },
    patient: { type: String, required: true, trim: true },
    urgency: {
      type: String,
      enum: ["Immediate", "Critical", "Within 4 Hours", "Within 6 Hours", "Within 12 Hours", "Within 24 Hours"],
      default: "Immediate",
    },
    unitsRequired: { type: Number, default: 1 },
    contactPhone: { type: String, default: "+91 985-452-964" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmergencyRequest", emergencyRequestSchema);

