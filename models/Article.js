const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    readTime: { type: String, default: "4 min read" },
    date: { type: String, required: true },
    image: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, default: "" },
    link: { type: String, default: "/blog/blood" },
    isPublished: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Article", articleSchema);

