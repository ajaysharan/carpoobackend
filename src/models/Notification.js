const mongoose = require('mongoose');

const Schema = new mongoose.Schema(
    {
        is_all: {
            type: Number,
            required: true,
            default: 0
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        heading: {
            type: String,
            required: true  
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: Number,
            required: true,
            default: 1
        },
        link: {
            type: String,
            default: null
        },
        attachment: {
            type: String,
            default: null
        },
        files: {
            type: [String],  
            default: []
          },
        is_read: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date, 
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Notification', Schema);
 