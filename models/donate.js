const mongoose = require("mongoose");

const donateSchema = new mongoose.Schema(
  {
    currency: { type: String, required: true },
    amount: { type: Number, required: true },
    paytype: { type: String, required: true },
    mail: { type: String, required: true },
    name: { type: String, required: true },
    blood: { type: String, required: true },
    mobile: { type: Number, required: true },
    birth: { type: String, required: true },
    gender: { type: String, required: true },
    address: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "signup" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("donate", donateSchema, "donate");
