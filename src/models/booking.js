const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "ongoing", "cancelled", "completed"],
      default: "pending",
    },
    seatsBooked: { 
      type: Number,
      required: true,
      min: [1, "At least one seat must be booked"],
    },
    totalPrice: {
      type: Number,
      required: true,
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
    paymentDetails: { 
      transactionId: String,
      paidAt: Date,
      refundId: String,
      refundedAt: Date,
    },
    reviewByPassenger: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
    reviewByDriver: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
    cancellationReason: String,
    cancelledBy: {
      type: String,
      enum: ["passenger", "driver", "system"],
    },
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
BookingSchema.index({ passenger: 1, status: 1 });
BookingSchema.index({ driver: 1, status: 1 });
BookingSchema.index({ ride: 1 });

module.exports = mongoose.model("Booking", BookingSchema);
