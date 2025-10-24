const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");

exports.createAdmin = async (req, res) => {
  try {
    let { fullname, email, role, password, mobile, status } = req.body;

    const emailExists = await Admin.findOne({ email, deletedAt: null });
    if (emailExists) throw new Error("Email already exists !!");

    const mobileExists = await Admin.findOne({ mobile, deletedAt: null });
    if (mobileExists) throw new Error("Mobile number already exists !!");

    let image =
      "https://amarastorage.s3.ap-south-1.amazonaws.com/image-1733836061707-91582400.png";
    if (req.file && req.file?.location) {
      image = req.file.location;
    }
    password = bcrypt.hashSync(password, 10);
    const admin = await Admin.create({
      fullname,
      email,
      role,
      password,
      image,
      mobile,
      status,
    });

    return res.successInsert(admin);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

// exports.updateAdmin = async (req, res) => {
//     try {
//         let admin = await Admin.findOne({ _id: new mongoose.Types.ObjectId(req.params.id), deletedAt: null });
//         if (!admin) return res.noRecords();

//         const vData = req.getBody(["fullname", "email", "role", "password", "mobile", "status"]);

//         if (vData.mobile && vData.mobile !== admin.mobile) {
//             const existingAdmin = await Admin.findOne({ mobile: vData.mobile, _id: { $ne: admin._id }, deletedAt: null });
//             if (existingAdmin) throw new Error("Mobile number already exists !!");
//         }

//         if (req.file && req.file?.location) vData.image = req.file.location
//         if (vData.password) vData.password = bcrypt.hashSync(vData.password, 10);

//         await Admin.updateOne({ _id: admin._id }, vData);
//         return res.successUpdate(admin);
//     } catch (error) {
//         return res.someThingWentWrong(error);
//     }
// };
    




exports.updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({_id: new mongoose.Types.ObjectId(req.params.id), deletedAt: null,});

    if (!admin) return res.noRecords();

    const vData = req.getBody([
      "fullname",
      "email",
      "role",
      "password",
      "mobile",
      "status",
    ]);

 
    if (vData.mobile && vData.mobile !== admin.mobile) {
      const exists = await Admin.findOne({ 
        mobile: vData.mobile,
        _id: { $ne: admin._id },
        deletedAt: null,
      });
      if (exists) throw new Error("Mobile number already exists!");
    }

    // ✅ Check unique email
    if (vData.email && vData.email !== admin.email) {
      const exists = await Admin.findOne({
        email: vData.email,
        _id: { $ne: admin._id },
        deletedAt: null,
      });
      if (exists) throw new Error("Email already exists!");
    }
    
    if (req.file && req.file.path) {
      vData.image = req.file.filename;
    }
 
    // ✅ Hash password
    if (vData.password) {
      vData.password = bcrypt.hashSync(vData.password, 10);
    }

    // ✅ Ensure role is ObjectId
    if (mongoose.Types.ObjectId.isValid(vData.role)) {
      vData.role = new mongoose.Types.ObjectId(vData.role);
    } else {
      delete vData.role;
    }

    // ✅ Update in DB
    await Admin.updateOne({ _id: admin._id }, vData);
   

    return res.successUpdate({ ...admin.toObject(), ...vData });
  } catch (err) {
    console.error("UpdateAdmin Error:", err);
    return res.someThingWentWrong(err);
  }
};


exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    await admin.updateOne({ deletedAt: moment().toISOString() });
    return res.successDelete(admin);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getAllAdmin = async (req, res) => {
  try {
    let { limit, pageNo, query, status } = req.query;
    limit = limit ? parseInt(limit) : 10;
    pageNo = pageNo ? parseInt(pageNo) : 1;

    var filters = { deletedAt: null };
    if (status) filters.status = status;

    if (query && query !== "") {
      filters["$or"] = [
        { fullname: { $regex: new RegExp(query, "i") } },
        { mobile: { $regex: new RegExp(query, "i") } },
        { email: { $regex: new RegExp(query, "i") } },
      ];
    }

    const results = await Admin.find(filters)
      .sort({ createdAt: -1 })
      .select("-password")
      .limit(limit)
      .skip((pageNo - 1) * limit)
      .populate("role");
    const total_count = await Admin.countDocuments(filters);

    if (results.length > 0) {
      return res.pagination(results, total_count, limit, pageNo);
    } else {
      return res.datatableNoRecords();
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getLoginAdmin = async (req, res) => {
  try {
    const admin = req.user;

    if (!admin) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    // ✅ Clean up image path if needed
    // if (admin.image && admin.image.startsWith("public/")) {
    //   admin.image = admin.image;
    // }
    

    return res.status(200).json({
      status: true,
      message: "Profile data fetched.",
      user: admin,
    });
  } catch (error) {
    console.error("getLoginAdmin error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};
