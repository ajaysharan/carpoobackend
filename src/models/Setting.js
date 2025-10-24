const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    setting_type: {
        type: Number,
        required: true,
    },
    setting_name: {
        type: String,
        required: true,
    },
    field_label: {
        type: String,
        required: true,
    },
    field_name: {
        type: String,
        required: true,
    },
    field_type: {
        type: String,
        required: true,
    },
    field_value: {
        type: String,
        required: true,
    },
    is_require: {
        type: Boolean,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("generalsettings", schema);

