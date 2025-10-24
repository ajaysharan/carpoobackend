const {licenseCheck,errorHandler,customMethods,showValidationErrors,} = require("../middelwares");
const frontController = require("../controllers/frontController");
const checkValid = require("../middelwares/validator");
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const commonController = require("../controllers/commonController");
const adminController = require("../controllers/adminController");
const roleController = require("../controllers/roleController");
const sendNotificationController = require("../controllers/sendNotificationController");
const testimonialController = require("../controllers/testimonialController");
const designationController = require("../controllers/designationController");
const companyPolicieController = require("../controllers/companyPolicieController");
const locationController = require("../controllers/locationController");
const cmsPagesController = require("../controllers/cmsPagesController");
const pageController = require("../controllers/pageController");
const rideController = require("../controllers/rideController");
const ContactEnquiryController = require("../controllers/ContactEnquiryController");
const generalSettingsController = require("../controllers/generalSettingsController")
const OurServicesController = require("../controllers/ourServicesController")
const authCheck = require("../middelwares/authToken");
const Storage = require("../helpers/storage");
const uploadSettings = new Storage.uploadTo({ dir: 'settings', isImage: true });
const authenticate = require("../middelwares/authToken");

const uploadImageServices = new Storage.uploadTo({
  dir: "ourServices", 
  isImage: true,
});
const uploadImageProfile = new Storage.uploadTo({
  dir: "user", 
  isImage: true,
});
const uploadImageAdmin = new Storage.uploadTo({
  dir: "profileAdmin",
  isImage: true,
});
const uploadImageDriverDocs = new Storage.uploadTo({
  dir: "driver",
  isImage: true,
});
const uploadImagVehicle = new Storage.uploadTo({
  dir: "vehicle",
  isImage: true,
});
const uploadImageUser = new Storage.uploadTo({
  dir: "profile",
  isImage: true,
});
const uploadImageCountryImages = new Storage.uploadTo({
  dir: "country",
  isImage: true,
});

const uploadImageStateImages = new Storage.uploadTo({
  dir: "state",
  isImage: true,
});
const uploadImageCityImages = new Storage.uploadTo({
  dir: "city",
  isImage: true,
});
const uploadDoc = new Storage.uploadTo({ dir: "policies", isDoc: true });
const uploadCMS = new Storage.uploadTo({
  dir: "cms_pages",
  isImage: true,
  isVideo: true,
});
router.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

// Custom Methods Load..
router.use(customMethods);

// License Check..
router.use(licenseCheck);

router.get("/settings", authController.settings);
router.get("/updateStatus/:table/:id", generalSettingsController.toggleStatus);
router.delete("/delete/:table/:id", generalSettingsController.delete);

// Clients Routes
router.get("/client", frontController.getClient);

router.post(
  "/client",
  checkValid("client"),
  showValidationErrors,
  frontController.createClient
);
router.put(
  "/client/:id",
  checkValid("client"),
  showValidationErrors,
  frontController.updateClient
);
router.delete("/client/:id", frontController.deleteClient);

// Testimonial Routes
router.get("/testimonial", testimonialController.get);
router.post(
  "/testimonial",
  checkValid("testimonial"),
  showValidationErrors,
  testimonialController.create
);
router.put(
  "/testimonial/:id",
  checkValid("testimonial"),
  showValidationErrors,
  testimonialController.update
);
router.delete("/testimonial/:id", testimonialController.delete);

// Designation Routes
router.post("/designation", designationController.create);
router.put("/designation/:id", designationController.update);
router.delete("/designation/:id", designationController.delete);
router.get("/designation", designationController.get);
router.get("/designation/:id", designationController.getSingle);

// Company Policies Routes
router.post(
  "/company-policies",
  uploadDoc.single("link"),
  companyPolicieController.create
);
router.put(
  "/company-policies/:id",
  uploadDoc.single("link"),
  companyPolicieController.update
);
router.delete("/company-policies/:id", companyPolicieController.delete);
router.get("/company-policies", companyPolicieController.get);

// our Services
// , upload.single("image")
router.post('/create-ourService', uploadImageServices.single("image"), OurServicesController.createService);
router.get('/getall-ourService',OurServicesController.getAllServices);
router.get('/get-ourService/:id', OurServicesController.getServiceById);
router.put('/update-ourService/:id', uploadImageServices.single("image"), OurServicesController.updateService);
router.put('/updateStatusService/:id',OurServicesController.updateStatusService);
router.delete('/delete-ourService/:id', OurServicesController.deleteService);



// router.get("/settings-list",generalSettingsController.getGeneralSettings)
router.get("/settings-list/:type", generalSettingsController.listGeneralSetting);
router.put('/update-settings', uploadSettings.fields([{ name: 'favicon', maxCount: 1 }, { name: 'logo', maxCount: 1 }, { name: 'footer_logo', maxCount: 1 }]), generalSettingsController.updateGeneralSetting)
 
 
// Auth Routes
router.post(
  "/register",
  checkValid("register"),
  authController.userRegistration
);
router.post("/login", authController.userLogin);
router.get("/logout", authController.logout);
router.post("/forgot-password", authController.ForgetPassword);
router.post("/recover-password/:id/:token", authController.ResetPassword);
router.get("/verify-email/:token", authController.verifyEmail);

// Protected Routes
router.use(authCheck);


// Admin profile gate 
// router.get('/profile',  adminController.getLoggedInAdmin);

// Admin
// router.post(
//   "/add-admin",
//   uploadImage.single("image"),
//   adminController.createAdmin
// );
router.get("/profile-admin", authenticate, adminController.getLoginAdmin);
router.put(
  "/update-admin/:id",
  uploadImageAdmin.single("image"), // ✅ Field name must be "image"
  adminController.updateAdmin
);
// router.put(
//   "/update-admin/:id",
//   uploadImage.single("image"),
//   adminController.updateAdmin
// );
router.delete("/delete-admin/:id", adminController.deleteAdmin);
router.get("/get-admins", adminController.getAllAdmin);
// User Routes
router.post(
  "/user",
  checkValid("user"),uploadImageUser.single('image'),
  showValidationErrors,
  userController.create
);
router.put(
  "/user/:id",uploadImageUser.single('image'),
  checkValid("user"),
  showValidationErrors,
  userController.update
);
router.put(
  "/user-documents-verificationAdmin/:id",
  uploadImageDriverDocs.fields([
    { name: "driverDocuments[license][url][0]", maxCount: 1 },
    { name: "driverDocuments[license][url][1]", maxCount: 1 },
    { name: "driverDocuments[idCard][url][0]", maxCount: 1 },
    { name: "driverDocuments[idCard][url][1]", maxCount: 1 },
  ]),
  userController.documents_uploadAdmin
);
router.put("/user-status", userController.updateStatus);
router.get("/user", userController.getAllUsers);
router.get("/user/:id", userController.getUser);
router.delete("/user/:id", userController.delete);
router.get("/user-table", userController.getUserFilter);
// router.post(
//   "/users-import",
//   uploadXlsx.single("xlsx"),
//   userController.usersImport
// );
router.put("/toggle-user-status", userController.toggleStatus);
router.put("/toggle-user/:id", userController.togglePhoneVerification );

router.get("/dashboard", commonController.dashboard);
router.get("/departments", commonController.departments);
router.get("/designations", commonController.designations);

// Drivers
router.get("/drivers", userController.getAllDrivers);
router.put("/verify-driver-license/:id", userController.Verify_Driver_License);
router.put("/verify-driver-id-status/:id", userController.Verify_Driver_Id);
router.put("/verify-user-status/:id", userController.Verify_Driver_Status);

// Passengers
router.get("/passengers", userController.getAllPassengers);

// Location
router.get("/country", locationController.getCountries);
router.put(
  "/country/:id",
  uploadImageCountryImages.fields([
    { name: "flag", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  locationController.updateCountryData
);
router.get("/state", locationController.getStates);
router.put("/toggle-status/state/:id", locationController.toggleStateStatus);
router.put(
  "/toggle-status/country/:id",
  locationController.toggleCountryStatus
);

router.put(
  "/state/:id",
  uploadImageStateImages.fields([
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  locationController.updateStateData
);
router.get("/cities", locationController.getCities);
router.put("/toggle-status/city/:id", locationController.toggleCityStatus);
router.put(
  "/city/:id",
  uploadImageCityImages.fields([
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  locationController.updateCityData
);

// ============ CMS Routes =============
router.get("/cms-pages", cmsPagesController.getAllCMSPages);

router.post(
  "/create-cms-pages",
  uploadCMS.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  cmsPagesController.create
);

router.get("/cms-page/:id", cmsPagesController.getCMSPages);

router.put(
  "/cms-page-update-status/:id",
  cmsPagesController.getCMSPageStatusToggle
);

router.put(
  "/edit-cms-pages/:id",
  uploadCMS.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  cmsPagesController.update
);
router.delete("/delete-cms-page/:id", cmsPagesController.delete);

// =========== Ride | start =========
router.get("/get-rides", rideController.getAllRides);
router.get("/get-bookings", rideController.getAllBookings);
router.put(
  "/update-ride-status/:driver_id",
  rideController.status_change_for_rides
);
router.put(
  "/update-booking-status/:ride_id",
  rideController.status_change_for_bookings
);
router.get("/verify-payment/:booking_id/:status?", rideController.verify_payment);
router.delete(
  "/deleteRide/:id",
  rideController.deleteRide
);
// =========== Ride | end ===========

// ======= Page List ========
router.get("/page-list", pageController.page_list);

// Profile
router.get("/profile", authController.profile);

router.put(  
  "/update-profile",
  uploadImageProfile.single("image"), // ✅ Correct middleware
  authController.updateProfile
);
    // router.put(
    //   "/update-profile",
    //   uploadImage.single("image"),
    //   authController.updateProfile
    // );
router.put("/change-password", authController.changePassword);
router.get("/settings", authController.settings);



// Role
router.post("/add-role", roleController.createRole);
router.put("/update-role/:id", roleController.updateRole);
router.put("/update-role/:id/permission", roleController.addPermission);
router.delete("/delete-role/:id", roleController.deleteRole);
router.get("/get-roles", roleController.getRole);
router.get("/get-role/:id", roleController.getSingleRole);
router.get("/role_permission/:id", roleController.role_permission);
router.post("/update_role_permission/:id", roleController.updateRolePermission);

// Enquiry
router.get("/get-enquiry", ContactEnquiryController.getEnquiry);
router.delete("/delete-enquiry/:id", ContactEnquiryController.deleteEnquiry);
router.get("/get-enquiry/:id", ContactEnquiryController.getSingleEnquiry);
// notification 
router.get("/send-notification", sendNotificationController.list);
router.delete("/notifications-delete/:id",sendNotificationController.notificationDelete)
// router.post('/NotificationCreate', sendNotificationController.createNotification);
router.post("/send-notification",uploadDoc.single("attachment"), sendNotificationController.send);

router.get("/list-feedback", commonController.listFeedback);
router.delete("/feedback/:id", commonController.deleteFeedback);

// Application Error handler
router.use(errorHandler);

// 404 API not found
router.all("*", function (req, res) {res.status(404).send({status: false,message: "API not found",data: [],});});

module.exports = router;



//  general settings
 
