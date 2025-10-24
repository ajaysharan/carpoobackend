const express = require("express");
const passport = require("../helpers/passport");
const router = express.Router();
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const licenseCheck = require("../middelwares/licenseCheck");
const authCheck = require("../middelwares/authTokenUser");
const checkValid = require("../middelwares/validator");
const { showValidationErrors } = require("../middelwares");
const Storage = require("../helpers/storage");
const generalSettingsController = require("../controllers/generalSettingsController");
const authController = require("../controllers/authController");
const locationController = require("../controllers/locationController");
const rideController = require("../controllers/rideController");
const userController = require("../controllers/userController");
const vehicleController = require("../controllers/vehicleController");
const cmsPagesController = require("../controllers/cmsPagesController");
const ContactEnquiryController = require("../controllers/ContactEnquiryController");
const OurServicesController = require('../controllers/ourServicesController')
const sendNotificationController = require("../controllers/sendNotificationController");

const { uploadImageProfile } = require("../middelwares/");
const uploadVehicleImage = new Storage.uploadTo({dir: "vehicles",isImage: true,});
const uploadImageDriverDocs = new Storage.uploadTo({dir: "driver",isImage: true,});

const uploadImagVehicle = new Storage.uploadTo({
  dir: "vehicle",
  isImage: true,
});
const uploadImageUser = new Storage.uploadTo({dir: "profile",isImage: true,});

// Middleware
// router.use(customMethods);
router.post("/enquirySubmit",ContactEnquiryController.submitEnquiryForm)
router.use(session({
    secret: process.env.JWT_SECRET_TOKEN_KEY, // Replace with a strong secret
    resave: false,saveUninitialized: false,cookie: { maxAge: 24 * 60 * 60 * 1000 },}));
router.use(passport.initialize());
router.use(passport.session());
// Passport Config
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/client/auth/google/callback",
      debug: true,
    },
    (accessToken, refreshToken, profile, done) => {
      // You can save the user info to a database here

      if (!accessToken) {
        console.error("Error obtaining access token:", accessToken);
      }

      return done(null, profile);
    }
  )
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
// Routes
router.get("/auth/google",passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", {failureRedirect: process.env.CLIENT_BASE_URL + "login?unauth=true",}),
  (_, res) => res.redirect(process.env.CLIENT_BASE_URL + "dashboard"));

// router.get("/logout", (req, res, next) => {
//   res.clearCookie("token");
//   req.logout((err) => {
//     if (err) {console.error("Error during logout:", err);return next(err); }  
//     res.redirect(process.env.CLIENT_BASE_URL + "login");});});
// console.log("Google OAuth routes initialized");
// ============ Customer Routes | Register, otp send, otp-resend, verify, login | start  =============
router.post("/register",checkValid("customer"), showValidationErrors,authController.customer_register);
router.post("/verify-otp", authController.verify_otp);
router.post("/resend-otp", authController.resend_otp);
router.post("/login", authController.customer_Login);
router.get("/logout", authController.logout); 
router.post("/forgot-password", authController.ForgetPasswordUser);
// router.post("/verify-otp-password", authController.verifyOtp);
router.post("/resetPassword", authController.ResetPassword);
router.get("/settings-list/:type", generalSettingsController.listGeneralSetting);
router.put("/update-profileUser",authCheck,uploadImageUser.single("image"),authController.userUpdateProfile);
router.post("/user",checkValid("user"),uploadImageUser.single('image'),showValidationErrors,userController.create);
router.put("/user-update/:id",uploadImageUser.single('image'),
checkValid("user"),showValidationErrors,userController.update);

router.delete("/user-delete/:id", userController.delete);
router.get("/user", userController.getAllUsers);
router.get("/drivers", userController.getAllDrivers);
// router.get("/user-details/:id", userController.fetchUserData);
// for mobileNUmber or address
router.get("/settings/:type", generalSettingsController.getGeneralSetting);
router.get('/getall-ourServices',OurServicesController.getAllServicesClient);
// ============ Customer Routes | Register, otp send, otp-resend, verify, login | end =============

router.post("/save-feedback", userController.saveFeedback);
router.get("/cms-pageData/:slug", cmsPagesController.getpageWithCmsContent);

// notification start
router.get("/list-notification", sendNotificationController.list);


router.put("/update-notification/:id", userController.updateNotification);
// router.delete("/delete-notification/:id", userController.deleteNotification);
router.delete("/notifications-delete/:id",sendNotificationController.notificationDelete)
// notification end 

router.use(authCheck);

router.use(licenseCheck);

router.get("/user", async (req, res) => res.json(req.user_data));

// Add error handling middleware
router.use((err, req, res, next) => {
  console.error("OAuth Error:", err);
  return res.redirect(process.env.CLIENT_BASE_URL + "login");
});

// ========== Profile | start ========
router.get("/profile", userController.getProfile);
router.get("/getUserFilter", userController.getUserFilter);
// ========== Profile | end =========

// ================== Location | Start ==================
router.get("/countries", locationController.getCountries);
router.get("/states", locationController.getStates);
router.get("/cities", locationController.getCities);
router.put("/toggle-status/country/:id",locationController.toggleCountryStatus);
router.put("/toggle-status/state/:id", locationController.toggleStateStatus);
router.put("/toggle-status/city/:id", locationController.toggleCityStatus);
router.get("/states/:country_id", locationController.getStateByCountryId);
router.get("/cities/:state_id", locationController.getCityByStateId);
// ================== Location | End ====================

// ================ Ride | start ================
router.post("/post-your-ride/:id",uploadVehicleImage.single("image"),rideController.ride_post);
router.get("/ride-search", rideController.ride_search);
// Route Example
router.put('/edit-ride/:id/:rideId', uploadVehicleImage.fields([{ name: 'image', maxCount: 1 }]), rideController.ride_edit);

router.post("/book-ride/:ride_id", rideController.book_ride);
router.get("/booked-rides/:id?",rideController.get_all_booked_rides_by_driver_id); 
router.get("/booking-list-by-status/:id/:status?", rideController.booking_by_status); //driver_id as id in params


router.get("/booking-information-by-status/:id", rideController.booking_status); //driver_id as id in params
router.put("/update-booking-status/:ride_id",rideController.status_change_for_bookings);
// ;router.put("/update-ride-status/:driver_id",rideController.status_change_for_rides)
router.put("/verify-user-status/:id", userController.Verify_Driver_Status);
router.put("/verify-driver-license/:id", userController.Verify_Driver_License);
router.put("/verify-driver-id-status/:id", userController.Verify_Driver_Id);

// ========== Review | start ======
// id = passenger_id / driver_id
router.post('/add-review/:id', rideController.customer_review);
router.delete("/deleteRide/:id",rideController.deleteRide);
router.get("/verify-payment/:booking_id/:status?", rideController.verify_payment);
// router.put("/update-ride-status/:ride_id", rideController.status_change_for_rides);
router.put("/update-ride-status/:ride_id/:status?", rideController.status_change_for_rides);

// ========== Review | end ========
router.post("/enquirySubmit",ContactEnquiryController.submitEnquiryForm)
router.get("/getAllRides", rideController.getAllRides);
// ================ Ride | end ==================
// ================ Booking | stARt ==================
router.get("/get-all-bookings", rideController.getAllBookings);
// ================ Booking | end ==================
// ========== Vehicle information update | start ===========
router.put(
  "/user-documents-verification/:id",
  uploadImageDriverDocs.fields([
    { name: "driverDocuments[license][url][0]", maxCount: 1 },
    { name: "driverDocuments[license][url][1]", maxCount: 1 },
    { name: "driverDocuments[idCard][url][0]", maxCount: 1 },
    { name: "driverDocuments[idCard][url][1]", maxCount: 1 },
  ]),
  userController.documents_upload
);

// const multiUploader = (req, res, next) => {
//   const uploadVehicle = uploadImagVehicle.fields([{ name: "vehicleImage", maxCount: 1 }]);
//   const uploadDocs = uploadImageDriverDocs.fields([
//     { name: "licenseFront", maxCount: 1 },
//     { name: "licenseBack", maxCount: 1 },
//   ]);

//   uploadVehicle(req, res, function (err) {
//     if (err) {
//       return res.status(400).json({ success: false, message: "Vehicle upload failed", error: err.message });
//     }

//     uploadDocs(req, res, function (err2) {
//       if (err2) {
//         return res.status(400).json({ success: false, message: "License upload failed", error: err2.message });
//       }

//       next();
//     });
//   });
// };
const vehicleAndLicenseUploader = (req, res, next) => {
  uploadImagVehicle.fields([
    { name: "vehicleDetails[image]", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      console.error("🚫 Vehicle Upload Error:", err);
      return res.status(400).json({
        success: false,
        message: "Vehicle upload failed",
        error: err.message,
      });
    }

    uploadImageDriverDocs.fields([
      { name: "driverDocuments[license][url][0]", maxCount: 1 },
      { name: "driverDocuments[license][url][1]", maxCount: 1 },
    ])(req, res, (err2) => {
      if (err2) {
        console.error("🚫 License Upload Error:", err2);
        return res.status(400).json({
          success: false,
          message: "License upload failed",
          error: err2.message,
        });
      }
      next();
    });
  });
};


router.post("/users/:id/vehicle-info", vehicleAndLicenseUploader, userController.addVehicleInfoAndLicense);
// router.post("/users/vehicle-info/:id", multiUploader,userController.addVehicleInfoAndLicense);
// ========= Vehicle information update | end =========
module.exports = router;
