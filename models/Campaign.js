const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    focus: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    goal: { type: Number, required: true },
    raised: { type: Number, default: 0 },
    beneficiaries: { type: String, default: "" },
    desc: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Campaign", campaignSchema);

