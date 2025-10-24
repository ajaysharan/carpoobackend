const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true, unique: true },
    country_id: { type: mongoose.Schema.Types.Number, ref: "Country" },
    country_code: { type: Number },
    country_name: { type: String },
    image: {
      type: String, 
      get: (value) => `${process.env.BASE_URL}uploads/city/${value}`,
    },
    banner: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/city/${value}`,
    },
    state_id: { type: mongoose.Schema.Types.Number, ref: "State" },
    state_name: { type: String },
    state_code: { type: String },
    latitude: { type: Number },
    address: { type: String },
    longitude: { type: Number },
    pincode: { type: String, default: "" },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    status: { type: Number, default: 1 },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

Schema.index({ id: 1 });
Schema.index({ state_id: 1 });
Schema.index({
  name: "text",
  title: "text",
  description: "text",
  pincode: "text",
});

module.exports = mongoose.model("City", Schema);
