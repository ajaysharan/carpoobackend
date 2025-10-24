const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: Number, enum: [1, 2], default: 1 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", Schema);
