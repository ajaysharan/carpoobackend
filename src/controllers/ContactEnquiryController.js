const Enquiry = require("../models/ContactEnquiry");
const ContactEnquiry = require("../models/ContactEnquiry");
const mongoose = require('mongoose');
const moment = require('moment')

exports.submitEnquiryForm = async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;
    console.log("Phone:", phone)
    if (!name || !email || !subject || !message || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const newEnquiry = new ContactEnquiry({
      name,
      email,
      subject,
      phone,
      message,
  
    });
    await newEnquiry.save(); 
    console.log("Contact form submitted:", newEnquiry);
    return res
      .status(200)
      .json({ success: true, message: "Form submitted successfully" });
  } catch (error) {
    console.error("Error saving contact form:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

exports.getEnquiry = async (req, res) => {
  try {
    const { limit = 10, pageNo = 1, query = "", status, orderBy = "createdAt", orderDirection = 'desc' } = req.query;
    // console.log("hello",req.query)
    const sortDirection = orderDirection.toLowerCase() === "asc" ? 1 : -1;
    const sort = { [orderBy]: sortDirection };

    const parsedLimit = Math.max(parseInt(limit), 1);   // Ensure limit is at least 1
    const parsedPageNo = Math.max(parseInt(pageNo), 1); // Ensure pageNo is at least 1

    // Build the filter object
    const filter = { deletedAt: null };
    console.log("hello",sort)
    if (query?.trim()) {
      filter.name = { $regex: query.trim(), $options: "i" };
    }

    const results = await Enquiry.find(filter)
    .sort(sort)
    .limit(parsedLimit)
    .skip((parsedPageNo - 1) * parsedLimit);


    const total_count = await Enquiry.countDocuments(filter);
    if (results.length > 0) {
      return res.pagination(results, total_count, limit, pageNo);
    } else {
      return res.datatableNoRecords();
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });
    if (!enquiry) return res.noRecords();

    await enquiry.updateOne({ deletedAt: moment().toISOString() });
    return res.successDelete(enquiry);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getSingleEnquiry = async (req, res) => {
  try {
    const role = await Enquiry.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });
    if (!role) return res.noRecords();

    return res.success(role);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};