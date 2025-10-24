const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true, unique: true },
    country_id: { type: mongoose.Schema.Types.Number },
    country_code: { type: String },
    country_name: { type: String },
    state_code: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    image: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/state/${value}`,
    },
    banner: {
      type: String, 
      get: (value) => `${process.env.BASE_URL}uploads/state/${value}`,
    },
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

StateSchema.index({ country_id: 1 });
StateSchema.index({ id: 1 });

StateSchema.index({
  name: "text",
  country_name: "text",
  title: "text",
  description: "text",
  state_code: "text",
});

StateSchema.virtual("country_details", {
  ref: "Country", // The model to use
  localField: "country_id", // Field in `State`
  foreignField: "id", // Field in `Country`
  justOne: true, // Set to `true` if expecting a single document
});
module.exports = mongoose.model("State", StateSchema);
