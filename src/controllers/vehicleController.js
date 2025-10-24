const Users = require("../models/User");
const Rides = require("../models/ride");
const Storage = require("../helpers/storage");
exports.update_vehicle_information = async (req, res) => {
  try {
    // const { user_id } = req.params;
    const user_id = req.params.user_id.trim();
    const data = req.body;
    console.log("update_vehicle_information", data, user_id);

    const user = await Users.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const vehicle = data.vehicleDetails || {};
    if (
      !vehicle.category ||
      !vehicle.model ||
      !vehicle.color ||
      !vehicle.licensePlate ||
      !vehicle.year
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (user.status !== 1)
      return res
        .status(400)
        .json({ message: "Your profile not approved by admin." });

    // If image is uploaded, update in Rides
    if (
      req.files &&
      req.files.image &&
      req.files.image[0] &&
      req.files.image[0].filename
    ) {
      const updatedRide = await Rides.findOneAndUpdate(
        { driver: user_id },
        { $set: { image: req.files.image[0].filename } },
        { new: true }
      );
    }

    // Update vehicle details in user
    user.vehicleDetails = {
      category: vehicle.category,
      model: vehicle.model,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      year: vehicle.year,
    };

    await user.save();
    return res.success(user);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.documents_upload = async (req, res) => {
  try {
    let existingUserDocumentsCheck = await Users.findById(req.params.id);
    if (!existingUserDocumentsCheck) return res.noRecords();
    const updatedData = {};

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
        req.files?.["driverDocuments[license][url][1]"][0] &&
        req.files?.["driverDocuments[license][url][1]"][0]?.filename
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
        req.files?.["driverDocuments[idCard][url][0]"][0] &&
        req.files?.["driverDocuments[idCard][url][0]"][0]?.filename
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
        idCardFiles.push(
          req.files?.["driverDocuments[idCard][url][0]"][0]?.filename
        );
        updatedData.driverDocuments.idCard = {
          idCard_Options:
            req.body.driverDocuments.idCard.idCard_Options || "Aadhaar Card",
        };
      }
      if (
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

    const updateUser = await Users.findByIdAndUpdate(
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
