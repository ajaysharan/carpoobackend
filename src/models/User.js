const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide a phone number"],
      unique: true,
    },
    role: {
      type: String,
      enum: ["passenger", "driver"],
      default: "passenger",
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    bio: String,
    vehicleDetails: {
      category: { type: String, enum: ["bike", "taxi", "car"]},
      model: String,
      color: String,
      licensePlate: String,
      year: String,
      image: {
        type: String,
        get: (value) => `${process.env.BASE_URL}uploads/vehicle/${value}`,
      }

    },
    driverDocuments: {
      license: {
        licenseNumber: String,
        url: {
          type: [String],
          get: (values) =>
            values.map(
              (value) => `${process.env.BASE_URL}uploads/driver/${value}`
            ),
        },
        verified: {
          type: Boolean,
          default: false,
        },
        uploadedAt: Date,
      },
      idCard: {
        idCardNumber: String,
        url: {
          type: [String],
          get: (values) =>
            values.map(
              (value) => `${process.env.BASE_URL}uploads/driver/${value}`
            ),
        },
        idCard_Options: {
          type: String,
          enum: ["Aadhaar Card", "PAN Card"],
          default: "Aadhaar Card",
        },
        verified: {
          type: Boolean,
          default: false,
        },
        uploadedAt: Date,
      },
    },
    status: {
      type: Number,
      enum: [0, 1, 2], 
      default: 0, 
    },
    image: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/profile/${value}`,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: Number,
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ], 
    otpData: {
      otp: String,
      expiresAt: Date,
    },
    deletedAt: { type: Date, default: null },    
  },  
  { timestamps: true, toObject: { getters: true }, toJSON: { getters: true } },  
);
UserSchema.index({ name: "text", email: "text", phone: "text" });
UserSchema.methods.generateToken = function () {
  try {
    return jwt.sign(
      {
        userId: this._id.toString(),
        email: this.email,
      },
      process.env.JWT_SECRET_TOKEN_KEY_EMPLOYEE,
      { expiresIn: "10d" }
    );
  } catch (error) {
    throw new Error(error?.message || "Token generation failed");
  }
};
module.exports = mongoose.model("User", UserSchema);
