const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    name: { type: String },
    slug: { type: String },
    status: { type: Number, default: 1 },
  }, 
  {
    timestamps: true,
  }
);
Schema.index({ slug: 1 });
module.exports = mongoose.model("PageList", Schema);
 