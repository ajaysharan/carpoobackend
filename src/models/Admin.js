const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const Schema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,   
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/profileAdmin/${value}`,
    },
    status: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Role",
    },
    verified: {
      type: Boolean, 
      default: true, 
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

Schema.methods.generateToken = function () {
  try {
     
    return jwt.sign(
      {
        userId: this._id.toString(),
        email: this.email,
        role: this.role,
      },
      process.env.JWT_SECRET_TOKEN_KEY,
      { expiresIn: "10d" }
    );
  } catch (error) {
    throw new Error("Token generation failed");
  }
};

module.exports = mongoose.model("Admin", Schema);
