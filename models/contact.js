const mongoose = require("mongoose");
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.MONGO_URL

const contactUsDb = mongoose.createConnection(
  url,
  { dbName: "Contactus"}
);

contactUsDb.on("error", console.error.bind(console, "MongoDB connection error for ContactusDB:"));
contactUsDb.once("open", () => console.log("Connected to Contactus MongoDB Successfully"));

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mail: { type: String, required: true },
  subject: { type: String, required: true },
  msg: { type: String, required: true },
});

module.exports = contactUsDb.model("contact", contactSchema, "contact");