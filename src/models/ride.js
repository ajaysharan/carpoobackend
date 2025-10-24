const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromCity: {
      type: String,
      required: [true, "Please provide a departure city"],
    },
    toCity: {
      type: String,
      required: [true, "Please provide a destination city"],
    },
    fromLocation: {
      address: { type: String, required: true },
      coordinates: {
        type: { 
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },
    toLocation: {
      address: { type: String, required: true },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          required: true,
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },
    date: {
      type: Date,
      required: [true, "Please provide a date"],
    },
    time: {
      type: String,
      required: [true, "Please provide a time"],
    },
    availableSeats: {
      type: Number,
      required: [true, "Please provide the number of available seats"],
      min: [1, "At least one seat must be available"],
    },
    totalSeats: {
      type: Number,
      required: [true, "Please provide the total number of seats"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a price per seat"],        
      min: [0, "Price cannot be negative"],
    },
    discount: {
      type: Number,
    },
    passengers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "confirmed", "cancelled", "completed"],
          default: "pending",
        },
        bookedAt: {
          type: Date,
          default: Date.now,
        },
        seatsBooked: {
          type: Number,
          default: 1,
        },
        totalPrice: {
          type: Number,
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "completed", "refunded"],
          default: "pending",
        },
        paymentMethod: {
          type: String,
          enum: ["cash", "online", "wallet"],
          default: "cash",
        },
      },
    ],
    description: String,
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    image: {
      type: String,
      get: (value) => `${process.env.BASE_URL}uploads/vehicles/${value}`,
    },
    preferences: {
      smoking: {
        type: Boolean,
        default: false,
      },
      pets: {
        type: Boolean,
        default: false,
      },
      music: {
        type: Boolean,
        default: false,
      },
      luggage: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "medium",
      },
    },
    routePolyline: String,
    estimatedDuration: {
      text: String,
      value: Number, // in seconds
    },
    estimatedDistance: {
      text: String,
      value: Number, // in meters
    },
  },
  {
    timestamps: true,
  }
);
// Index for geospatial queries
RideSchema.index({ "fromLocation.coordinates": "2dsphere" });
RideSchema.index({ "toLocation.coordinates": "2dsphere" });

// Index for searching rides
RideSchema.index({ fromCity: "text", toCity: "text" });

// Index for date-based queries
RideSchema.index({ date: 1 });

// Method to check if ride is bookable
RideSchema.methods.isBookable = function () {
  return (
    this.status === "active" &&
    this.availableSeats > 0 &&
    new Date(this.date) > new Date()
  );
};

// Method to calculate total price for a booking
RideSchema.methods.calculateTotalPrice = function (seats = 1) {
  return this.price * seats;
};

module.exports = mongoose.model("Ride", RideSchema);
