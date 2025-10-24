const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Designation', Schema);
