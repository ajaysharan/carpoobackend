const mongoose = require("mongoose");

const Schema = new mongoose.Schema(
  {
    id: Number,
    name: { type: String, required: true, unique: true },
    iso3: String,
    iso2: String,
    numeric_code: Number,
    phone_code: String,
    capital: String,
    currency: String,
    currency_name: String,
    currency_symbol: String,
    tld: String,
    native: String,
    region: String,
    subregion: String,
    timezones: String,
    latitude: { type: Number },
    longitude: { type: Number }, 
    image: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/country/${value}`,
    },
    banner: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/country/${value}`,
    },
    emoji: String,
    emojiU: String,
    flag: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/country/${value}`,
    },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    status: { type: Number, default: 1 }, // 1 : Active;  2 : Inactive
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

Schema.index({ id: 1 });

module.exports = mongoose.model("Country", Schema);
