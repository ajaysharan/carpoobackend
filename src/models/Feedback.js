const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        rating: {
            type: Number,
            required: true
        },
        message: {
            type: String,
            default: null,
            nullable: true
        },
        tags: {
            type: [String],
            default: []
        },
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            default: null
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Feedback', Schema);
