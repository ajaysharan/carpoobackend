const mongoose = require('mongoose');

const OurServicesSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/ourServices/${value}`,
      // required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    deletedAt: {
      type: Date,
      default:null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OurServices', OurServicesSchema);

