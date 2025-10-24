const { Admin, Setting } = require("../models/index.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const base64url = require("base64url");
const { mailer } = require("../helpers/mail.js");
const { generateEmailTemplate } = require("../helpers/mail.js");
const { makeid } = require("../helpers/string.js");
const mongoose = require("mongoose");
const RolePermissionModel = require("../models/RolePermissions");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const { generateOTP } = require("../helpers");
const sendSMS = require("../helpers/sendSMS.js");

// for admin registration
exports.userRegistration = async (req, res) => {
  try {
    const { fullname, email, password, phone } = req.body;
    let user = await Admin.findOne({ email });

    if (user)
      return res
        .status(409)
        .json({ status: false, message: "Email already exists" });

    const hash_password = await bcrypt.hash(password, 10);
    const verificationToken = makeid(30);
    user = new Admin({
      fullname,
      email,
      phone,
      password: hash_password,
    }).save();
    // console.log("USER: ", user);
    // const verificationLink = `${process.env.CLIENT_BASE_URL}/auth/confirm-mail/${user.verificationToken}`;

    // const emailType = "verify";
    // const recipientName = user.fullname;
    // const actionLink = verificationLink;

    // const emailTemplate = generateEmailTemplate(
    //   emailType,
    //   recipientName,
    //   actionLink
    // );

    // const mailOptions = {
    //   from: process.env.EMAIL,
    //   to: user.email,
    //   subject: emailTemplate.subject,
    //   html: emailTemplate.html,
    // };

    // mailer.sendMail(mailOptions, function (error, info) {
    //   if (error) {
    //     return res.status(500).json({
    //       status: false,
    //       message: "Failed to send verification email",
    //     });
    //   } else {
    //     return res.status(201).json({
    //       status: true,
    //       message:
    //         "Admin registered successfully. Please check your email to verify your account.",
    //       data: user,
    //     });
    //   }
    // });

    return res.status(201).json({
      status: true,
      message:
        "user registered successfully. Please check your email to verify your account.",
      data: user,
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    let user = await Admin.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Invalid or expired verification token",
      });
    }
    user.verified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json({ status: true, message: "Email verified successfully" });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    let admin = await Admin.findOne({ email, deletedAt: null });
    if (!admin)
      return res.json({ status: false, message: "Email not found..!!" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res.json({ status: false, message: "Password is incorrect" });

    if (!admin.verified)
      return res.status(401).json({
        status: false,
        message: "Please verify your email before logging in",
      });

    if (!admin.status)
      return res.status(401).json({
        status: false,
        message: "Profile disabled.. Please contact admin..!!",
      });

    const token = await admin.generateToken();

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      //   secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
      sameSite: "None", // 'strict' | 'Lax' | 'None', // Prevent CSRF attacks
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      status: true,
      message: "Admin Login Successfully..!!",
      data: {
        user: admin.fullname,
        email: admin.email,
        role: admin.role,
        token: token,
      },
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.logout = async (req, res) => {
  try {
    console.log("Logout requested");
    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: new Date(0),
    });
    console.log("Logout successful, cookie cleared");

    return res
      .status(200)
      .send({ status: true, message: "Logout successful", data: [] });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.ForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Admin.findOne({ email, deletedAt: null });
    if (!user)
      return res.send({ status: false, message: "Email not found..!!" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_TOKEN_KEY,
      { expiresIn: "1h" }
    );
    const safeToken = base64url(token);

    const resetPasswordLink = `${process.env.CLIENT_BASE_URL}reset-password/${user._id}/${safeToken}`;
    const emailType = "reset";
    const recipientName = user.fullname;
    const actionLink = resetPasswordLink;

    const emailTemplate = generateEmailTemplate(
      emailType,
      recipientName,
      actionLink
    );

    mailer.sendMail(
      {
        from: process.env.EMAIL,
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      },
      function (error, info) {
        if (error) {
          return res.send({ status: false, message: "Failed to send email" });
        } else {
          return res.send({ status: true, message: "Success" });
        }
      }
    );
  } catch (err) {
    res.send({ Status: err.message });
  }
};
exports.ForgetPasswordUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, deletedAt: null });
    if (!user) {
      return res.send({ status: false, message: "Email not found." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP & expiry to user
    user.otpData.otp = otp;
    user.otpData.expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds
    await user.save();

    // Generate email
    const emailTemplate = generateEmailTemplate("otp", user.name, otp);

    await mailer.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.SMTP_USERNAME}>`,
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    return res.send({
      status: true,
      message: "OTP sent successfully to your email",
    });
  } catch (err) {
    console.error("ForgetPasswordUser error:", err);
    return res.send({ status: false, message: err.message });
  }
};
// exports.verifyOtp = async (req, res) => {
//   const { email, otp } = req.body;

//   try {
//     const user = await User.findOne({ email, deletedAt: null });
//     if (!user)
//       return res.status(404).send({ status: false, message: "User not found" });

//     const isOtpValid =
//       // user.otpData.otp === Number(otp) && user.otpData.expiresAt > Date.now();
//       Number(user.otpData.otp) === Number(otp) &&
//       user.otpData.expiresAt > Date.now();
//     console.log("isOtpValid", user);
//     console.log("isOtpValid", Date.now());

//     if (!isOtpValid) {
//       return res
//         .status(400)
//         .send({ status: false, message: "Invalid or expired OTP" });
//     }

//     return res.status(200).send({ status: true, message: "OTP verified" });
//   } catch (err) {
//     console.error("Verify OTP error:", err);
//     return res
//       .status(500)
//       .send({ status: false, message: "Something went wrong" });
//   }
// };

exports.ResetPassword = async (req, res) => {
  const { password, email, otp } = req.body;
  // console.log("ResetPassword request:", req.body);
  try {
    if (!email) {
      return res.json({ status: false, message: "Error with email " });
    }
    if (!password ) {
      return res.json({ status: false, message: "Error with password " });
    }
    if (!otp) {
      return res.json({ status: false, message: "Error with  otp" });
    }

    const user = await User.findOne({ email, deletedAt: null });
    if (!user)
      return res.status(404).send({ status: false, message: "User not found" });

    const isOtpValid =
      Number(user.otpData.otp) === Number(otp) &&
      user.otpData.expiresAt > Date.now();
    // console.log("isOtpValid", isOtpValid);
    if (!isOtpValid) {
      return res
        .status(400)
        .send({ status: false, message: "Invalid or expired OTP" });
    }
      // console.log("password",password)
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.otpData = {  
      otp: "",
      expiresAt: "",
    };
    await user.save();
    if (user) {
      res.send({ status: true, message: "Success" });
    } else {
      res.send({ status: false, message: "user not found" });
    }
  } catch (err) {
  console.log("ResetPassword error:", err);
    res.json({
      status: false,
      message: "Error with token",
      Error: err.message,
    });
  }
};

exports.customer_register = async (req, res) => {
  try {
    const { name, phone } = req.body;
    let data = req.body;
    data.slug = uuidv4();
    if (!name) {
      return res
        .status(400)
        .json({ message: "name is required.", status: false });
    }
    if (!phone) {
      return res
        .status(400)
        .json({ message: "phone is required.", status: false });
    }
    const alreadyExist = await User.findOne({ phone, deletedAt: null });
    if (alreadyExist) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const otp = generateOTP(6);
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 1); //expires otp in a minute

    data.otpData = {
      otp: otp,
      expiresAt: expirationTime,
    };

    const user = await User.create(data);
    return res.success(user);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.verify_otp = async (req, res) => {
  try {
    const { otp, phone } = req.body;
    if (!otp) {
      return res
        .status(400)
        .json({ message: "OTP not received", status: false });
    }
    if (!phone) {
      return res
        .status(400)
        .json({ message: "Phone number not received", status: false });
    }
    const user = await User.findOne({ phone });
    if (!user || !user.otpData?.otp) return res.noRecords();

    if (user.otpData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() < new Date(user.otpData.expiresAt)) {
      user.isPhoneVerified = true;
      console.log("user", user.otpData);
      user.otpData = {
        otp: "",
        expiresAt: "",
      };

      await user.save();
      const token = await user.generateToken();

      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: true,
        //   secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: "None", // 'strict' | 'Lax' | 'None', // Prevent CSRF attacks
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      return res.success({ user, token });
    }
    return res.noRecords();
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.resend_otp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res.status(400).json({ message: "Phone number required!" });
    const user = await User.findOne({ phone });
    if (!user) return res.noRecords("User not found.");

    const otp = generateOTP(6);
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 1); //expires otp in a minute

    user.otpData = {
      otp: otp,
      expiresAt: expirationTime,
    };
    await user.save();
    return res.success(user);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.customer_Login = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone)
      return res
        .status(400)
        .json({ status: false, message: "Phone not found..!!" });

    let user = await User.findOne({ phone, deletedAt: null });
    if (!user)
      return res
        .status(400)
        .json({ status: false, message: "User not found..!!" });

    if (!user.isPhoneVerified)
      return res.status(401).json({
        status: false, 
        message: "Please verify your phone number before logging in",
      });

    const otp = generateOTP(6);
    const expirationTime = new Date();

    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    user.otpData = {
      otp: otp,
      expiresAt: expirationTime,
    };

    await user.save();

    let sms = await sendSMS(user.phone, user.otpData.otp);
    console.log("sms", sms);

    res.success(user?.otpData?.otp);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.profile = async (req, res) => {
  try {
    let user = req.user;
    if (!user)
      return res.json({ message: "Admin not found", status: false }, 401);

    const rolePermission = await RolePermissionModel.find({
      roleId: user.role._id,
    });

    const modifiedRolePermission = rolePermission.reduce((acc, item) => {
      acc[item.module] = item;
      return acc;
    }, {});

    res.success({
      status: true,
      message: "Profile data fetched.",
      user: {
        fullname: user.fullname,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        image: user.image,
        _id: user._id,
      },
      permissions: modifiedRolePermission || [],
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    let user = req.user;

    if (!user)
      return res.json({ message: "User not found", status: false }, 401);
    const vData = req.getBody(["fullname", "email", "mobile"]);

    if (vData.mobile && vData.mobile !== user.mobile) {
      const existingUser = await Admin.findOne({
        mobile: vData.mobile,
        _id: { $ne: user._id },
        deletedAt: null,
      });
      if (existingUser) throw new Error("Mobile number already exists !!");
    }

    if (vData.email && vData.email !== user.email) {
      const existingUser = await Admin.findOne({
        email: vData.email,
        _id: { $ne: user._id },
        deletedAt: null,
      });
      if (existingUser) throw new Error("Email already exists !!");
    }

    if (req.file && req.file?.location) {
      vData.image = req.file.location;
    }
    await Admin.updateOne({ _id: req.user._id }, vData);
    return res.successUpdate([]);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// user Profile update done
exports.userUpdateProfile = async (req, res) => {
  try {
    console.log("req.body", req.body);
    let user = req.body.user || req.user;
    console.log("req.user", user);

    if (!user) {
      return res.status(401).json({ message: "User not found", status: false });
    }

    const vData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    };

    if (vData.phone && vData.phone !== user.phone) {
      const existingUser = await User.findOne({
        phone: vData.phone,
        _id: { $ne: user._id },
        deletedAt: null,
      });
      if (existingUser) throw new Error("Phone number already exists!");
    }

    if (vData.email && vData.email !== user.email) {
      const existingUser = await User.findOne({
        email: vData.email,
        _id: { $ne: user._id },
        deletedAt: null,
      });
      if (existingUser) throw new Error("Email already exists!");
    }

    // Image upload (Multer S3 or local)
    if (req.file && req.file.location) {
      vData.image = req.file.location;
    } else if (req.file && req.file.path) {
      vData.image = req.file.path; // for local uploads
    }

    await User.updateOne({ _id: user._id }, vData);

    return res.successUpdate([]); // custom helper
  } catch (error) {
    return res.someThingWentWrong(error); // custom helper
  }
};

exports.changePassword = async (req, res) => {
  try {
    const match = bcrypt.compareSync(req.body.old_password, req.user.password);
    if (!match) throw new Error("Old password not match..!!");
    await Admin.updateOne(
      { _id: req.user._id },
      { password: bcrypt.hashSync(req.body.new_password, 10) }
    );
    return res.successUpdate([]);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.settings = async (req, res) => {
  try {
    const settings = await Setting.find({ setting_type: 1 });
    var setting_arr = settings.reduce(
      (obj, item) =>
        Object.assign(obj, {
          [item.field_name]: isNaN(item.field_value)
            ? item.field_value
            : parseFloat(item.field_value),
        }),
      {}
    );

    res.success(setting_arr);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
