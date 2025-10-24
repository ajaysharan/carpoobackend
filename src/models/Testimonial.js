const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
    {
        userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, trim: true, required: true },
        status: { type: Number, default: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Testimonial', Schema);
