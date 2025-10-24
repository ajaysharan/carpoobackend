import mongoose from "mongoose"

const notificationRideSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "new_message",
        "ride_booked",
        "booking_confirmed",
        "booking_cancelled",
        "ride_completed",  
        "payment_received",
        "document_verified",
        "new_review",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    data: {
      rideId: mongoose.Schema.Types.ObjectId,
      bookingId: mongoose.Schema.Types.ObjectId,
      conversationId: mongoose.Schema.Types.ObjectId,
      userId: mongoose.Schema.Types.ObjectId,
      reviewId: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
notificationRideSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

export default mongoose.models.Notification || mongoose.model("NotificationRide", notificationRideSchema)
