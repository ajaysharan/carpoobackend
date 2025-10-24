const mongoose = require("mongoose");
const {
  User,
  Designation,
  Department,
  Feedback,
  Notification,
} = require("../models");
const XLSX = require("xlsx");
const yup = require("yup");
const bcrypt = require("bcrypt");
const moment = require("moment");
const { getNameFromNumber, getErrorMessages } = require("../helpers/string");
const Storage = require("../helpers/storage");
const RolePermissions = require("../models/RolePermissions");
const qs = require("qs");

exports.fetchUserData = async (id) => {
  const results = await User.aggregate([
    { $match: { _id: id, deletedAt: null } },
    {
      $lookup: {
        from: "designations",
        localField: "designation",
        foreignField: "_id",
        as: "designation",
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "department",
        foreignField: "_id",
        as: "department",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "reportingManager",
        foreignField: "_id",
        as: "reporting",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "managerId",
        foreignField: "_id",
        as: "manager",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "buddyId",
        foreignField: "_id",
        as: "buddy",
      },
    },
    {
      $lookup: {
        from: "buddysupportareas",
        localField: "support_areas",
        foreignField: "_id",
        as: "supports_in",
        pipeline: [{ $match: { deletedAt: null } }, { $project: { label: 1 } }],
      },
    },
    {
      $lookup: {
        from: "scheduleinductions",
        localField: "_id",
        foreignField: "userId",
        as: "inductions",
        pipeline: [
          { $match: { deletedAt: null } },
          { $project: { updatedAt: 0, deletedAt: 0 } },
          { $group: { _id: "$day", items: { $push: "$$ROOT" } } },
          { $sort: { _id: 1 } },
        ],
      },
    },
    {
      $lookup: {
        from: "userdocuments",
        localField: "_id",
        foreignField: "userId",
        as: "documents",
        pipeline: [
          {
            $match: { deletedAt: null },
          },
          {
            $lookup: {
              from: "documents",
              localField: "type",
              foreignField: "_id",
              as: "document_name",
            },
          },
          {
            $set: {
              document_name: { $arrayElemAt: ["$document_name.name", 0] },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "userassets",
        localField: "_id",
        foreignField: "userId",
        as: "assets",
        pipeline: [
          {
            $match: { deletedAt: null },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "userofferdocuments",
        localField: "_id",
        foreignField: "userId",
        as: "offerdocuments",
        pipeline: [
          {
            $match: { deletedAt: null },
          },
        ],
      },
    },
    {
      $project: {
        employeeId: 1,
        fullName: 1,
        email: 1,
        designation: { $arrayElemAt: ["$designation._id", 0] },
        designation_name: { $arrayElemAt: ["$designation.name", 0] },
        department: { $arrayElemAt: ["$department._id", 0] },
        department_name: { $arrayElemAt: ["$department.name", 0] },
        reportingManagerName: {
          $ifNull: [{ $arrayElemAt: ["$reporting.fullName", 0] }, ""],
        },
        reportingManager: {
          $ifNull: [{ $arrayElemAt: ["$reporting._id", 0] }, ""],
        },
        offerSigned: { $ifNull: ["$offerSigned", false] },
        itSetup: { $ifNull: ["$itSetup", false] },
        training: { $ifNull: ["$training", 0] },
        firstCheckIn: { $ifNull: ["$firstCheckIn", false] },
        firstCheckInManager: { $ifNull: ["$firstCheckInManager", false] },
        onboardingStatus: { $ifNull: ["$onboardingStatus", 0] },
        documents: { $ifNull: ["$documents", []] },
        assets: { $ifNull: ["$assets", []] },
        offerdocuments: { $ifNull: ["$offerdocuments", []] },
        status: { $ifNull: ["$status", false] },
        createdAt: 1,

        phone: { $ifNull: ["$phone", ""] },
        dateOfBirth: { $ifNull: ["$dateOfBirth", ""] },
        currentAddress: { $ifNull: ["$currentAddress", ""] },
        permanentAddress: { $ifNull: ["$permanentAddress", ""] },
        emergencyContact: { $ifNull: ["$emergencyContact", ""] },
        reportingManager: { $ifNull: ["$reportingManager", ""] },
        employmentType: { $ifNull: ["$employmentType", ""] },
        workLocation: { $ifNull: ["$workLocation", ""] },
        probationStatus: { $ifNull: ["$probationStatus", ""] },
        totalCTC: { $ifNull: ["$totalCTC", ""] },
        bonusEligibility: { $ifNull: ["$bonusEligibility", ""] },
        stockOptions: { $ifNull: ["$stockOptions", ""] },
        insurance: { $ifNull: ["$insurance", ""] },
        travelAllowance: { $ifNull: ["$travelAllowance", ""] },
        mealAllowance: { $ifNull: ["$mealAllowance", ""] },
        education: { $ifNull: ["$education", ""] },
        certifications: { $ifNull: ["$certifications", ""] },
        technicalSkills: { $ifNull: ["$technicalSkills", ""] },
        languages: { $ifNull: ["$languages", ""] },
        industryExpertise: 1,
        managerName: {
          $ifNull: [{ $arrayElemAt: ["$manager.fullName", 0] }, ""],
        },
        managerId: { $ifNull: [{ $arrayElemAt: ["$manager._id", 0] }, ""] },
        buddyName: { $ifNull: [{ $arrayElemAt: ["$buddy.fullName", 0] }, ""] },
        buddyId: { $ifNull: [{ $arrayElemAt: ["$buddy._id", 0] }, ""] },
        supports_in: { $ifNull: ["$supports_in", []] },
        inductions: { $ifNull: ["$inductions", []] },
        policy_acknowledged: { $ifNull: ["$policy_acknowledged", []] },
        checkInDate: { $ifNull: ["$checkInDate", ""] },
        checkInTime: { $ifNull: ["$checkInTime", ""] },
      },
    },
  ]);

  return results;
};
/// /** done in postmen  */
exports.create = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const image = req.file?.filename || null;
    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        status: false,
        message: "All required fields must be filled.",
      });
    }

    const checkExist = await User.findOne({ email, deletedAt: null });
    if (checkExist)
      return res
        .status(400)
        .json({ status: false, message: "Email Already exist..!!" });

    // Create user document
    const user = await User.create({
      name,
      email,
      phone,
      image,
    });
    return res.successInsert(user);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
/// /** done in postmen  */
exports.update = async (req, res) => {
  try {
    let { id } = req.params; // use let here
    id = id.trim(); // now reassignment is valid
    console.log("Received ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findOne({ _id: id, deletedAt: null });
    if (!user) return res.noRecords();

    const { name, email, phone, role } = req.body;
    const image = req.file?.filename || user.image || null;

    await User.updateOne(
      { _id: id },
      { $set: { name, email, phone, role, image } }
    );

    return res.success({
      status: true,
      message: "User updated successfully.",
      data: { _id: id, name, email, phone, role, image },
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

/// /** done in postmen  */
exports.documents_upload = async (req, res) => {
  try {
    let existingUserDocumentsCheck = await User.findById(req.params.id);
    if (!existingUserDocumentsCheck) return res.noRecords();
    const updatedData = {};
    updatedData.vehicleDetails = {
      category: req.body.vehicleDetails?.category?.toLowerCase(),
      model: req.body.vehicleDetails?.model,
      color: req.body.vehicleDetails?.color,
      licensePlate: req.body.vehicleDetails?.licensePlate,
      year: req.body.vehicleDetails?.year,
    };
    if (req.files && Object.keys(req.files).length > 0) {
      const licenseFiles = [];
      const idCardFiles = [];
      updatedData.driverDocuments = updatedData.driverDocuments || {};
      updatedData.driverDocuments.license =
        updatedData.driverDocuments.license || {};
      updatedData.driverDocuments.idCard =
        updatedData.driverDocuments.idCard || {};
      if (
        req.files?.["driverDocuments[license][url][0]"][0] &&
        req.files?.["driverDocuments[license][url][0]"][0]?.filename
      ) {
        Storage.deleteFile(
          existingUserDocumentsCheck.driverDocuments?.license?.url
        );
        licenseFiles.push(
          req.files?.["driverDocuments[license][url][0]"][0]?.filename
        );
      }
      if (
        req.files?.["driverDocuments[license][url][1]"] &&
        req.files?.["driverDocuments[license][url][1]"][0] &&
        req.files?.["driverDocuments[license][url][1]"]?.[0]?.filename
      ) {
        if (
          Array.isArray(
            existingUserDocumentsCheck.driverDocuments?.license?.url
          )
        ) {
          existingUserDocumentsCheck.driverDocuments.license.url.forEach(
            (file) => Storage.deleteFile(file)
          );
        } else if (existingUserDocumentsCheck.driverDocuments?.license?.url) {
          Storage.deleteFile(
            existingUserDocumentsCheck.driverDocuments.license.url
          );
        }
        licenseFiles.push(
          req.files?.["driverDocuments[license][url][1]"][0]?.filename
        );
      }
      if (licenseFiles.length > 0) {
        updatedData.driverDocuments.license.url = licenseFiles;
      }
      if (
        req.files?.["driverDocuments[license][url][0]"] &&
        req.files?.["driverDocuments[license][url][0]"]?.[0] &&
        req.files?.["driverDocuments[idCard][url][0]"]?.[0]?.filename
      ) {
        if (
          Array.isArray(existingUserDocumentsCheck.driverDocuments?.idCard?.url)
        ) {
          existingUserDocumentsCheck.driverDocuments.idCard.url.forEach(
            (file) => Storage.deleteFile(file)
          );
        } else if (existingUserDocumentsCheck.driverDocuments?.idCard?.url) {
          Storage.deleteFile(
            existingUserDocumentsCheck.driverDocuments.idCard.url
          );
        }
        // console.log("req.files", req.files);
        idCardFiles.push(
          req.files?.["driverDocuments[idCard][url][0]"][0]?.filename
        );
        updatedData.driverDocuments.idCard = {
          idCard_Options:
            req.body.driverDocuments.idCard.idCard_Options || "Aadhaar Card",
        };
      }
      if (
        req.files?.["driverDocuments[idCard][url][1]"] &&
        req.files?.["driverDocuments[idCard][url][1]"][0] &&
        req.files?.["driverDocuments[idCard][url][1]"][0]?.filename
      ) {
        Storage.deleteFile(
          existingUserDocumentsCheck.driverDocuments.idCard.url
        );
        idCardFiles.push(
          req.files?.["driverDocuments[idCard][url][1]"][0]?.filename
        );
        updatedData.driverDocuments.idCard = {
          idCard_Options:
            req.body.driverDocuments.idCard.idCard_Options || "Aadhaar Card",
        };
      }
      if (idCardFiles.length > 0) {
        updatedData.driverDocuments.idCard.url = idCardFiles;
      }
    }
    if (req.body.driverDocuments.license.licenseNumber) {
      updatedData.driverDocuments = {
        ...updatedData.driverDocuments,
        license: {
          ...updatedData.driverDocuments?.license,
          licenseNumber: req.body.driverDocuments.license.licenseNumber,
        },
      };
    }
    if (req.body.driverDocuments.idCard.idCardNumber) {
      updatedData.driverDocuments = {
        ...updatedData.driverDocuments,
        idCard: {
          ...updatedData.driverDocuments?.idCard,
          idCardNumber: req.body.driverDocuments.idCard.idCardNumber,
        },
      };
    }

    const updateUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );
    return res.success({
      status: true,
      message: "Documents uploaded successfully.",
      data: updateUser,
    });
  } catch (error) {
    console.log(error);
    return res.someThingWentWrong(error);
  }
};

exports.documents_uploadAdmin = async (req, res) => {
  try {
    let updateUser = await User.findById(req.params.id);
    if (!updateUser) return res.noRecords();
    const parsedBody = qs.parse(req.body);
    // console.log("Parsed Body:", parsedBody);
    // const updatedData = {};
    updateUser.vehicleDetails = {
      category: parsedBody.vehicleDetails?.category?.toLowerCase(),
      model: parsedBody.vehicleDetails?.model,
      color: parsedBody.vehicleDetails?.color,
      licensePlate: parsedBody.vehicleDetails?.licensePlate,
      year: parsedBody.vehicleDetails?.year,
    };
    if (req.files && Object.keys(req.files).length > 0) {
      const licenseFiles = [];
      const idCardFiles = [];
      // License images
      if (
        req.files?.["driverDocuments[license][url][0]"]?.[0] &&
        req.files?.["driverDocuments[license][url][0]"]?.[0]?.filename
      ) {
        Storage.deleteFile(updateUser.driverDocuments?.license?.url);
        licenseFiles.push(
          req.files["driverDocuments[license][url][0]"][0].filename
        );
      }
      if (
        req.files?.["driverDocuments[license][url][1]"]?.[0] &&
        req.files?.["driverDocuments[license][url][1]"]?.[0]?.filename
      ) {
        const oldLicenseUrls = updateUser.driverDocuments?.license?.url;
        if (Array.isArray(oldLicenseUrls)) {
          oldLicenseUrls.forEach((file) => Storage.deleteFile(file));
        } else if (oldLicenseUrls) {
          Storage.deleteFile(oldLicenseUrls);
        }
        licenseFiles.push(
          req.files["driverDocuments[license][url][1]"][0].filename
        );
      }
      if (licenseFiles.length > 0) {
        updateUser.driverDocuments.license.url = licenseFiles;
      }
      // ID card images
      if (
        req.files?.["driverDocuments[idCard][url][0]"]?.[0] &&
        req.files?.["driverDocuments[idCard][url][0]"]?.[0]?.filename
      ) {
        const oldIdUrls = updateUser.driverDocuments?.idCard?.url;
        if (Array.isArray(oldIdUrls)) {
          oldIdUrls.forEach((file) => Storage.deleteFile(file));
        } else if (oldIdUrls) {
          Storage.deleteFile(oldIdUrls);
        }
        idCardFiles.push(
          req.files["driverDocuments[idCard][url][0]"][0].filename
        );
        updateUser.driverDocuments.idCard.idCard_Options =
          parsedBody.driverDocuments?.idCard?.idCard_Options || "Aadhaar Card";
      }
      if (
        req.files?.["driverDocuments[idCard][url][1]"]?.[0] &&
        req.files?.["driverDocuments[idCard][url][1]"]?.[0]?.filename
      ) {
        Storage.deleteFile(updateUser.driverDocuments.idCard?.url);
        idCardFiles.push(
          req.files["driverDocuments[idCard][url][1]"][0].filename
        );
        updateUser.driverDocuments.idCard.idCard_Options =
          parsedBody.driverDocuments?.idCard?.idCard_Options || "Aadhaar Card";
      }
      if (idCardFiles.length > 0) {
        updateUser.driverDocuments.idCard.url = idCardFiles;
      }
    }
    // License Number
    if (parsedBody.driverDocuments?.license?.licenseNumber) {
      updateUser.driverDocuments.license.licenseNumber =
        parsedBody.driverDocuments.license.licenseNumber;
    }
    // ID Card Number
    if (parsedBody.driverDocuments?.idCard?.idCardNumber) {
      updateUser.driverDocuments.idCard.idCardNumber =
        parsedBody.driverDocuments.idCard.idCardNumber;
    }
    await updateUser.save();
    return res.success({
      status: true,
      message: "Documents uploaded successfully.",
      data: updateUser,
    });
  } catch (error) {
    console.log(error);
    return res.someThingWentWrong(error);
  }
};
// exports.addVehicleInfoAndLicense = async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const {
//       category,
//       model,
//       color,
//       licensePlate,
//       year,
//       licenseNumber,
//     } = req.body;
//     const allowedCategories = ["bike", "taxi", "car"];
//     if (!allowedCategories.includes(category?.toLowerCase())) {
//       return res.status(400).json({ success: false, message: "Invalid vehicle category" });
//     }   
//     const user = await User.findById(userId);
//     if (!user || user.role !== "driver") {
//       return res.status(404).json({ success: false, message: "Driver not found" });
//     }
//     const vehicleImage = req.files?.vehicleImage?.[0]?.filename;
//     const licenseFront = req.files?.licenseFront?.[0]?.filename;
//     const licenseBack = req.files?.licenseBack?.[0]?.filename;
//     user.vehicleDetails = {
//       category: category.toLowerCase(),
//       model,
//       color,
//       licensePlate,
//       year,
//       image: vehicleImage,
//     };
//    user.driverDocuments.license = {licenseNumber: licenseNumber || user.driverDocuments.license.licenseNumber,
//       url: [licenseFront, licenseBack].filter(Boolean),uploadedAt: new Date(),verified: false,};
//     await user.save();
//     return res.status(200).json({
//       success: true,
//       message: "Vehicle and License info added successfully",
//       vehicleDetails: user.vehicleDetails,
//       license: user.driverDocuments.license,
//     });
//   } catch (err) {
//     console.error("Vehicle Info Upload Error:", err);
//     return res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };

// exports.documents_upload = async (req, res) => {
//   try {
//     let existingUserDocumentsCheck = await User.findById(req.params.id);
//     if (!existingUserDocumentsCheck) return res.noRecords();
//     const updatedData = {};

//     updatedData.vehicleDetails = {
//       category: req.body.vehicleDetails?.category?.toLowerCase(),
//       model: req.body.vehicleDetails?.model,
//       color: req.body.vehicleDetails?.color,
//       licensePlate: req.body.vehicleDetails?.licensePlate,
//       year: req.body.vehicleDetails?.year,
//     };
//     if (req.files && Object.keys(req.files).length > 0) {
//       const licenseFiles = [];
//       const idCardFiles = [];
//       updatedData.driverDocuments = updatedData.driverDocuments || {};
//       updatedData.driverDocuments.license =
//         updatedData.driverDocuments.license || {};
//       updatedData.driverDocuments.idCard =
//         updatedData.driverDocuments.idCard || {};
//       if (
//         req.files?.["driverDocuments[license][url][0]"][0] &&
//         req.files?.["driverDocuments[license][url][0]"][0]?.filename
//       ) {
//         Storage.deleteFile(
//           existingUserDocumentsCheck.driverDocuments?.license?.url
//         );
//         licenseFiles.push(
//           req.files?.["driverDocuments[license][url][0]"][0]?.filename
//         );
//       }
//       if (
//         req.files?.["driverDocuments[license][url][1]"][0] &&
//         req.files?.["driverDocuments[license][url][1]"][0]?.filename
//       ) {
//         if (
//           Array.isArray(
//             existingUserDocumentsCheck.driverDocuments?.license?.url
//           )
//         ) {
//           existingUserDocumentsCheck.driverDocuments.license.url.forEach(
//             (file) => Storage.deleteFile(file)
//           );
//         } else if (existingUserDocumentsCheck.driverDocuments?.license?.url) {
//           Storage.deleteFile(
//             existingUserDocumentsCheck.driverDocuments.license.url
//           );
//         }
//         licenseFiles.push(
//           req.files?.["driverDocuments[license][url][1]"][0]?.filename
//         );
//       }
//       if (licenseFiles.length > 0) {
//         updatedData.driverDocuments.license.url = licenseFiles;
//       }

//       if (
//         req.files?.["driverDocuments[idCard][url][0]"][0] &&
//         req.files?.["driverDocuments[idCard][url][0]"][0]?.filename
//       ) {
//         if (
//           Array.isArray(existingUserDocumentsCheck.driverDocuments?.idCard?.url)
//         ) {
//           existingUserDocumentsCheck.driverDocuments.idCard.url.forEach(
//             (file) => Storage.deleteFile(file)
//           );
//         } else if (existingUserDocumentsCheck.driverDocuments?.idCard?.url) {
//           Storage.deleteFile(
//             existingUserDocumentsCheck.driverDocuments.idCard.url
//           );
//         }
//         idCardFiles.push(
//           req.files?.["driverDocuments[idCard][url][0]"][0]?.filename
//         );
//         updatedData.driverDocuments.idCard = {
//           idCard_Options:
//             req.body.driverDocuments.idCard.idCard_Options || "Aadhaar Card",
//         };
//       }
//       if (
//         req.files?.["driverDocuments[idCard][url][1]"][0] &&
//         req.files?.["driverDocuments[idCard][url][1]"][0]?.filename
//       ) {
//         Storage.deleteFile(
//           existingUserDocumentsCheck.driverDocuments.idCard.url
//         );
//         idCardFiles.push(
//           req.files?.["driverDocuments[idCard][url][1]"][0]?.filename
//         );
//         updatedData.driverDocuments.idCard = {
//           idCard_Options:
//             req.body.driverDocuments.idCard.idCard_Options || "Aadhaar Card",
//         };
//       }

//       if (idCardFiles.length > 0) {
//         updatedData.driverDocuments.idCard.url = idCardFiles;
//       }
//     }

//     if (req.body.driverDocuments.license.licenseNumber) {
//       updatedData.driverDocuments = {
//         ...updatedData.driverDocuments,
//         license: {
//           ...updatedData.driverDocuments?.license,
//           licenseNumber: req.body.driverDocuments.license.licenseNumber,
//         },
//       };
//     }

//     if (req.body.driverDocuments.idCard.idCardNumber) {
//       updatedData.driverDocuments = {
//         ...updatedData.driverDocuments,
//         idCard: {
//           ...updatedData.driverDocuments?.idCard,
//           idCardNumber: req.body.driverDocuments.idCard.idCardNumber,
//         },
//       };
//     }

//     const updateUser = await User.findByIdAndUpdate(
//       req.params.id,
//       { $set: updatedData },
//       { new: true }
//     );
//     return res.success({
//       status: true,
//       message: "Documents uploaded successfully.",
//       data: updateUser,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.someThingWentWrong(error);
//   }
// };
exports.addVehicleInfoAndLicense = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user || user.role !== "driver") {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    const updatedData = {};

    // ✅ Vehicle Details
    updatedData.vehicleDetails = {
      category: req.body?.vehicleDetails?.category?.toLowerCase(),
      model: req.body?.vehicleDetails?.model,
      color: req.body?.vehicleDetails?.color,
      licensePlate: req.body?.vehicleDetails?.licensePlate,
      year: req.body?.vehicleDetails?.year,
    };

    // ✅ Files handling
    const licenseFiles = [];
    const vehicleFileField = req.files?.["vehicleDetails[image]"]?.[0]?.filename;

    if (vehicleFileField) {
      // Delete old vehicle image if exists
      if (user.vehicleDetails?.image) {
        Storage.deleteFile(user.vehicleDetails.image);
      }
      updatedData.vehicleDetails.image = vehicleFileField;
    }

    // License front and back
    const licenseFront = req.files?.["driverDocuments[license][url][0]"]?.[0]?.filename;
    const licenseBack = req.files?.["driverDocuments[license][url][1]"]?.[0]?.filename;

    if (licenseFront || licenseBack) {
      // Delete existing license files
      if (Array.isArray(user.driverDocuments?.license?.url)) {
        user.driverDocuments.license.url.forEach(file => Storage.deleteFile(file));
      }

      if (licenseFront) licenseFiles.push(licenseFront);
      if (licenseBack) licenseFiles.push(licenseBack);

      updatedData.driverDocuments = {
        license: {
          licenseNumber: req.body?.driverDocuments?.license?.licenseNumber || "",
          url: licenseFiles,
          verified: false,
          uploadedAt: new Date(),
        },
      };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updatedData }, { new: true });

    return res.status(200).json({
      success: true,
      message: "Vehicle and license info uploaded successfully",
      data: updatedUser,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    let user = await User.findOne({
      _id: new mongoose.Types.ObjectId(`${req.body.id}`),
      deletedAt: null,
    });
    if (!user) return res.noRecords();

    const keyToUpdate = req.body.keyToUpdate;
    if (
      ![
        "offerSigned",
        "itSetup",
        "firstCheckIn",
        "firstCheckInManager",
      ].includes(keyToUpdate)
    ) {
      throw new Error("Invalid key To Update..!!");
    }

    // Create feedback document
    await user.updateOne({ $set: { [keyToUpdate]: !user[keyToUpdate] } });
    return res.successUpdate();
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// /** done in postmen  */
exports.delete = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.deletedAt = moment().toISOString();
    await user.save();

    return res.successDelete(user);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// /** done in postmen  */
exports.getAllUsers = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = "desc",
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection.toLowerCase() === "asc" ? 1 : -1;

    let filters = { deletedAt: null };
    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const finalQuery = { ...filters, ...searchFilter };

    const totalCount = await User.countDocuments(finalQuery);
    const users = await User.find(finalQuery)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [orderBy]: sortOrder })
      .select("-password");

    return res.pagination(users, totalCount, limit, pageNo);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// /** done in postmen  */
exports.getAllDrivers = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = -1,
    } = req.query;
    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection === "1" ? 1 : -1;

    let filters = { deletedAt: null, role: "driver" };
    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const finalQuery = { ...filters, ...searchFilter };

    const totalCount = await User.countDocuments(finalQuery);
    const users = await User.find(finalQuery)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [orderBy]: sortOrder })
      .select("-password");

    return res.pagination(users, totalCount, limit, pageNo);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
exports.Verify_Driver_License = async (req, res) => {
  try {
    const { id } = req.params;
    const { license } = req.body;
    const result = await User.findById(id).select("-password");
    if (!result) return noRecords();
    const check = result?.driverDocuments?.license?.url;
    if (!check)
      return res
        .status(400)
        .send({ message: "Can not verify without license document." });
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          "driverDocuments.license.verified": license,
        },
      },
      { new: true }
    );
    // .select("-password");

    if (!updatedUser) {
      return res.noRecords();
    }

    return res.success({
      status: true,
      message: `License ${license ? "verified" : "unverified"} successfully.`,
      data: updatedUser,
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
exports.Verify_Driver_Id = async (req, res) => {
  try {
    const { id } = req.params;
    const { idStatus } = req.body;
    const result = await User.findById(id).select("-password");
    if (!result) return noRecords();
    const check = result?.driverDocuments?.idCard?.url;
    if (!check)
      return res
        .status(400)
        .send({ message: "Can not verify without Id document." });
    const update = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          "driverDocuments.idCard.verified": idStatus,
        },
      },
      { new: true }
    );
    return res.success({
      status: true,
      message: "Id verified successfully.",
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
exports.Verify_Driver_Status = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await User.findById(id).select("-password");
    if (!result) return noRecords();
    const checkId = result?.driverDocuments?.idCard?.verified;
    const checkLicense = result?.driverDocuments?.license?.verified;
    if (status === "1") {
      if (!checkId || !checkLicense)
        return res.status(400).send({
          message: "Can not approve without Id & license verification.",
        });
    }

    const update = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          status: status,
        },
      },
      { new: true }
    );

    return res.success({
      status: true,
      message: "Status updated successfully.",
      data: update,
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getAllPassengers = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = -1,
    } = req.query;
    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection === "1" ? 1 : -1;
    let filters = { deletedAt: null, role: "passenger" };
    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
          ],
        }
      : {};
    const finalQuery = { ...filters, ...searchFilter };
    const totalCount = await User.countDocuments(finalQuery);
    const users = await User.find(finalQuery)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [orderBy]: sortOrder })
      .select("-password");
    return res.pagination(users, totalCount, limit, pageNo);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new Error("Invalid User Id..!!");

    const result = await User.findById(id).select("-password");
    if (result) {
      return res.success({
        status: true,
        message: "fetched user information successfully.",
        data: result,
      });
    } else {
      return res.noRecords();
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// ***
exports.getProfile = async (req, res) => {
  try {
    let user = req.user;
    const results = await User.find(user._id).select("-otpData");
    return res.json({
      status: true,
      message: "Profile data fetched successfully.",
      data: results,
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// ***
exports.getUserFilter = async (req, res) => {
  try {
    let {
      limit,
      pageNo,
      query,
      status,
      designation,
      department,
      onboardingStatus,
    } = req.query;

    limit = limit ? parseInt(limit) : 10;
    pageNo = pageNo ? parseInt(pageNo) : 1;

    var filters = { deletedAt: null };
    if (status) filters.status = status == "1";
    if (department)
      filters.department = new mongoose.Types.ObjectId(department);
    if (designation)
      filters.designation = new mongoose.Types.ObjectId(designation);

    if (query && query !== "") {
      filters["$or"] = [
        { employeeId: { $regex: new RegExp(query, "i") } },
        { fullName: { $regex: new RegExp(query, "i") } },
        { email: { $regex: new RegExp(query, "i") } },
      ];
    }

    if (
      (onboardingStatus || onboardingStatus == 0) &&
      onboardingStatus !== ""
    ) {
      filters.onboardingStatus = parseInt(onboardingStatus);
    }

    const results = await User.aggregate([
      { $match: filters },
      { $sort: { createdAt: -1 } },
      { $skip: (pageNo - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "designations",
          localField: "designation",
          foreignField: "_id",
          as: "designation",
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $lookup: {
          from: "usertrainings",
          localField: "_id",
          foreignField: "userId",
          as: "trainings",
          pipeline: [
            {
              $group: {
                _id: null,
                totalModule: { $sum: 1 },
                totalProgress: { $sum: "$progress" },
              },
            },
            {
              $project: {
                _id: 0,
                allOverProgress: {
                  $cond: [
                    { $eq: ["$totalModule", 0] },
                    0,
                    {
                      $round: [
                        { $divide: ["$totalProgress", "$totalModule"] },
                        0,
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          employeeId: 1,
          fullName: 1,
          email: 1,
          designation: { $arrayElemAt: ["$designation._id", 0] },
          designation_name: { $arrayElemAt: ["$designation.name", 0] },
          department: { $arrayElemAt: ["$department._id", 0] },
          department_name: { $arrayElemAt: ["$department.name", 0] },
          offerSigned: { $ifNull: ["$offerSigned", false] },
          itSetup: { $ifNull: ["$itSetup", false] },
          training: { $arrayElemAt: ["$trainings.allOverProgress", 0] },
          firstCheckIn: { $ifNull: ["$firstCheckIn", false] },
          firstCheckInManager: { $ifNull: ["$firstCheckInManager", false] },
          onboardingStatus: { $ifNull: ["$onboardingStatus", 0] },
          status: 1,
          createdAt: 1,
        },
      },
    ]);

    const total_count = await User.countDocuments(filters);

    if (results.length > 0) {
      return res.pagination(results, total_count, limit, pageNo);
    } else {
      return res.datatableNoRecords();
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, ids } = req.body;

    if (status == undefined)
      throw new Error("Please provide status, you want to update..!!");
    if (ids == undefined && ids.length <= 0)
      throw new Error("Please provide user ids..!!");

    await User.updateMany(
      { _id: ids.map((r) => new mongoose.Types.ObjectId(r)) },
      { status }
    );
    return res.successUpdate([]);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// pending??//
exports.usersImport = async (req, res) => {
  try {
    const verify_only = req.body.verify_only;

    if (!req.file || !req.file.location)
      throw new Error("Please upload '.xlsx' file..!!");
    if (
      ![
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(req.file.mimetype)
    ) {
      throw new Error("Please upload '.xlsx' file only..!!");
    }

    let users = await User.find({ deletedAt: null });
    let designations = await Designation.find({ deletedAt: null }, "_id");
    let departments = await Department.find({ deletedAt: null }, "_id");

    designations = designations.map((r) => r._id.toString());
    departments = departments.map((r) => r._id.toString());
    let employeeIds = users.map((r) => r.employeeId);
    let emails = users.map((r) => r.email);

    const validationSchema = yup.object().shape({
      employeeId: yup
        .string()
        .typeError("Data must be string..!!")
        .min(5, "Min length should be 5.")
        .max(100, "Min length should be 100.")
        .test(
          "checkUnique",
          "Duplicate Employee Id or Already exist..!!",
          (value) => !employeeIds.includes(value)
        )
        .required("Employee Id Required..!!"),
      fullName: yup
        .string()
        .typeError("Data must be string..!!")
        .min(10, "Min length should be 10.")
        .max(100, "Min length should be 100.")
        .required("Employee Full Name Required..!!"),
      email: yup
        .string()
        .typeError("Data must be string..!!")
        .email()
        .min(10, "Min length should be 10.")
        .max(100, "Min length should be 100.")
        .test(
          "checkUnique",
          "Duplicate Email Address or Already exist..!!",
          (value) => !emails.includes(value)
        )
        .required("Employee Email Required..!!"),
      designation: yup
        .string()
        .test("checkValid", "Invalid designation id..!!", (value) =>
          designations.includes(value)
        )
        .test("checkId", "Invalid Object id..!!", (value) =>
          mongoose.isValidObjectId(value)
        )
        .required("Employee Designation Required..!!"),
      department: yup
        .string()
        .test("checkValid", "Invalid department id..!!", (value) =>
          departments.includes(value)
        )
        .test("checkId", "Invalid Object id..!!", (value) =>
          mongoose.isValidObjectId(value)
        )
        .required("Employee Department Required..!!"),
    });

    const file = XLSX.readFile(req.file.path);
    let exportData = [];
    let errorsCount = 0;
    for (let i = 0; i < file.SheetNames.length; i++) {
      const temp = XLSX.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      temp.forEach((row) => {
        try {
          validationSchema.validateSync(row, { abortEarly: false });
          exportData.push({ ...row, error: null });

          // Collect for validation
          departments.push(row.department);
          designations.push(row.designation);
          employeeIds.push(row.employeeId);
          emails.push(row.email);
        } catch (err) {
          ++errorsCount;
          exportData.push({ ...row, error: getErrorMessages(err) });
        }
      });
    }

    // Convert data to worksheet format
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    exportData.forEach((row, i) => {
      let { error, ...rest } = row;
      Object.entries(rest).forEach(([key], j) => {
        if (error?.[key] !== undefined) {
          let char = getNameFromNumber(j + 1);
          worksheet[`${char}${i + 2}`].c = [
            { t: `${key} : ${error?.[key]}`, hidden: true },
          ];
        }
      });
    });

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Export workbook to file
    const filePath = `uploads/import-errors/error-${req.file.originalname}`;
    XLSX.writeFile(workbook, "./public/" + filePath);

    if (errorsCount > 0) {
      return res.status(422).json({
        status: false,
        message: "Invalid Data provided..!!",
        data: process.env.BASE_URL + filePath,
      });
    } else {
      if (!verify_only) await User.insertMany(exportData);
      return res.success();
    }
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// *** done in postmen ///
exports.saveFeedback = async (req, res) => {
  try {
    const { userId, rating, message = "", tags = [] } = req.body;
    if (!userId)
      return res
        .status(400)
        .json({ status: false, message: "Please provide userId." });
    if (!rating)
      return res
        .status(400)
        .json({ status: false, message: "Please select rating." });
    const feedback = await Feedback.create({ userId, rating, message, tags });
    return res.successInsert(feedback);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
exports.deleteNotification = async (req, res) => {
  try {
    let user = await User.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });
    console.log("user", user);
    if (!user) return res.noRecords();
    // Create feedback document
    await Notification.updateMany(
      { user: user._id },
      { $set: { deletedAt: moment().toISOString() } }
    );
    return res.successDelete();
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, message, heading, link } = req.body;

    // console.log("Update Notification ID:", id);
    // console.log("Update Notification Body:", req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid notification ID." });
    }

    const notification = await Notification.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!notification) return res.noRecords();

    const updateFields = {};

    if (typeof type !== "undefined") {
      updateFields.is_read = Boolean(type);
    }

    if (typeof message === "string" && message.trim() !== "") {
      updateFields.message = message.trim();
    }

    if (typeof heading === "string" && heading.trim() !== "") {
      updateFields.heading = heading.trim();
    }

    if (typeof link === "string" && link.trim() !== "") {
      updateFields.link = link.trim();
    }

    console.log("Updating fields:", updateFields);

    await notification.updateOne({ $set: updateFields });

    return res.successUpdate();
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

// exports.updateNotification = async (req, res) => {
//   try {
//     console.log("Update Notification Data:", req.body);
//     const { id, type } = req.body;
//     let notification = await Notification.findOne({
//       _id: new mongoose.Types.ObjectId(req.body.id),
//       deletedAt: null,
//     });
//     if (!notification) return res.noRecords();

//     // Create feedback document
//     await notification.updateOne({ $set: { is_read: !!req.body.type } });
//     return res.successUpdate();
//   } catch (error) {
//     return res.someThingWentWrong(error);
//   }
// };
exports.togglePhoneVerification = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find current user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Toggle the value
    user.isPhoneVerified = !user.isPhoneVerified;
    await user.save();

    res.status(200).json({
      status: true,
      message: "Phone verification status toggled successfully.",
      data: user,
    });
    // res.status(200).json({
    //   status: true,
    //   message: "Updated",
    //   data: user, // updated user
    // });
  } catch (error) {
    console.error("Error toggling phone verification:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
