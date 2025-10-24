const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  phone: {type: Number, required: true,},
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

const Enquiry = mongoose.model("enquiry", enquirySchema);

module.exports = Enquiry;
 