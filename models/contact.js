const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mail: { type: String, required: true },
    subject: { type: String, required: true },
    msg: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("contact", contactSchema, "contact");
