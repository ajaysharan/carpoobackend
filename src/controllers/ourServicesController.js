
const OurService = require("../models/OurServices");


exports.createService = async (req, res) => {
  try {
    const { heading, description, status } = req.body;
    const image = req.file?.filename || null;

    if (!heading || !description || !image) {
      return res.status(400).json({
        status: false,
        message: "All fields (heading, description, image) are required.",
        data: {
          heading: !heading ? "Heading is required" : undefined,
          description: !description ? "Description is required" : undefined,
          image: !image ? "Image is required" : undefined,
        },
      });
    }

    const newService = await OurService.create({
      heading,
      description,
      image,
      status: Number(status) || 1,
    });

    return res.status(200).json({
      status: true,
      data: { message: "Service created successfully", service: newService },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
    });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    let { limit, pageNo, query = "", orderBy, orderDirection, status = 1 } = req.query;

    const sortDirection = orderDirection.toLowerCase() === "asc" ? 1 : -1;
    const sort = { [orderBy]: sortDirection };

    const parsedLimit = Math.max(parseInt(limit), 1);   // Ensure limit is at least 1
    const parsedPageNo = Math.max(parseInt(pageNo), 1); // Ensure pageNo is at least 1

    let where = { deletedAt: null };

    if (query) {
      where.heading = { $regex: query, $options: "i" };
    }

    const results = await OurService.find(where)
      .sort(sort)
      .limit(parsedLimit)
      .skip((parsedPageNo - 1) * parsedLimit);

    const total_count = await OurService.countDocuments(where);
    
    return res.pagination(results, total_count, limit, pageNo);
  } catch (err) {
    return res.someThingWentWrong(error);
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await OurService.findById(req.params.id);
    if (!service) return res.status(404).json({ status: false, message: "Service not found" });
    res.status(200).json({ status: true, data: service });
  } catch (err) {
    res.status(500).json({ status: false, message: "Fetch failed", error: err.message });
  }
};
 
exports.updateService = async (req, res) => {
  try {
    const { heading, description,status } = req.body;
    const updatedData = {
      heading,
      description,
      status,
      ...(req.file?.filename && { image: req.file.filename }),
    };

    const updated = await OurService.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updated) return res.status(404).json({ status: false, message: "Service not found" });
    res.status(200).json({ status: true, message: "Updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ status: false, message: "Update failed", error: err.message });
  }
};

exports.updateStatusService = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedData = { status,  };
    const updated = await OurService.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updated) return res.status(404).json({ status: false, message: "Service not found" });
    res.status(200).json({ status: true, message: "Updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ status: false, message: "Update failed", error: err.message });
  }
};


exports.deleteService = async (req, res) => {
  try {
    const deleted = await OurService.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: false, message: "Service not found" });
    res.status(200).json({ status: true, message: "Service deleted" });
  } catch (err) {
    res.status(500).json({ status: false, message: "Deletion failed", error: err.message });
  }
};    

exports.getAllServicesClient = async (req, res) => {
  try {
    let { limit, pageNo, query = null, status = null } = req.query;

    limit = limit ? parseInt(limit) : 10;
    pageNo = pageNo ? parseInt(pageNo) : 1;

    let where = { deletedAt: null, status: 1 }; // Added status filter

    if (query) {
      where.heading = { $regex: query, $options: "i" };
    }

    const results = await OurService.find(where)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((pageNo - 1) * limit);

    const total_count = await OurService.countDocuments(where);

    if (results.length > 0) {
      return res.pagination(results, total_count, limit, pageNo);
    } else {
      return res.datatableNoRecords();
    }
  } catch (err) {
    return res.someThingWentWrong(err); // fixed variable name from 'error' to 'err'
  }
};
