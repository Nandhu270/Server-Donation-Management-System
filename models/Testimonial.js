const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    avatar: { type: String, default: "" },
    isApproved: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);

