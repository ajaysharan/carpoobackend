const express = require('express');
const router = express.Router();
const authTokenUser = require('../middelwares/authTokenUser');
const licenseCheck = require('../middelwares/licenseCheck');

const commonController = require('../controllers/commonController');
const authController2 = require('../controllers/authController');
const authController = require('../controllers/employee/authController');

router.use(licenseCheck);
router.get('/settings', authController2.settings);
router.get('/company-policies', commonController.companyPolicies);

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgetPassword);
router.post('/reset-password', authController.resetPassword);

router.use(authTokenUser);
router.get('/profile', authController.profile);
router.get('/logout', authController.logout);
router.get('/testimonials', authController.testimonials);

module.exports = router;
