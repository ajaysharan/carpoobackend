const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        link: { type: String, required: true, trim: true },
        deletedAt: { type: Date, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model('CompanyPolicie', Schema);
