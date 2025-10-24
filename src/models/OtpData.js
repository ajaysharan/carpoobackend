const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
    {
        phone: {
            type: Number,
        },
        email: {
            type: String,
        },
        otp: {
            type: Number,
            required: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('OtpData', Schema);
