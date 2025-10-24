const Rides = require("../models/ride");
const Users = require("../models/User");
const Booking = require("../models/booking");
const Payment = require("../models/Payment");
const { createRazorpayOrder } = require("../helpers/ridePurchase");
const mongoose = require("mongoose");
const User = require("../models/User");
const { mailer } = require("../helpers/mail");
const { sendMail } = require("../helpers/sendMail");
const ride = require("../models/ride");



// **
exports.ride_post = async (req, res) => {
  try {
    const { id } = req.params;

    const userExists = await Users.findById(id);
    if (!userExists) return res.noRecords("No user found...");

    const {
      fromCity,
      toCity,
      date,
      time,
      availableSeats,
      fromLocation,
      toLocation,
      totalSeats,
      price,
      routePolyline,
    } = req.body;

    if (
      !fromCity ||
      !toCity ||
      !fromLocation ||
      !toLocation ||
      !date ||
      !time ||
      !availableSeats ||
      !totalSeats ||
      !price ||
      !routePolyline ||
      availableSeats == null ||
      totalSeats == null ||
      price == null
    )
      return res.status(400).json({ message: "All Fields are required!" });

    if (availableSeats <= 0 || totalSeats <= 0 || price <= 0)
      return res.status(400).json({ message: "Invalid ride information!" });

    const { category, model, color, licensePlate, year } =
      userExists.vehicleDetails;
    if (!category || !model || !color || !licensePlate || !year) {
      return res
        .status(400)
        .json({ message: "All vehicle details are required!" });
    }

    if (!userExists.isPhoneVerified)
      return res.status(400).json({ message: "Phone number is not verified!" });
    if (
      !userExists.driverDocuments.license.verified ||
      !userExists.driverDocuments.idCard.verified ||
      userExists.status !== 1
    )
      return res.status(400).json({
        message:
          "Vehicle documents are not verified or document verification status is pending!",
      });

    if (Number(availableSeats) > Number(totalSeats)) {
      return res
        .status(400)
        .json({ message: "Available seats cannot exceed total seats!" });
    }

    const rideData = { ...req.body, driver: id };

    if (req.files && Object.keys(req.files).length > 0) {
      if (
        req.files.image &&
        req.files.image[0] &&
        req.files.image[0].filename
      ) {
        rideData.image = req.files.image[0].filename;
      }
    }

    const results = await Rides.create(rideData);
    return res.success(results);
  } catch (error) {
    console.log("ERROR: ", error);
    return res.someThingWentWrong(error);
  }
};

// edit ride 
exports.ride_edit = async (req, res) => {
  try {
    const { id, rideId } = req.params;
    const userExists = await Users.findById(id);
    if (!userExists) return res.noRecords("No user found...");
    const rideExists = await Rides.findById(rideId);
    if (!rideExists) return res.noRecords("Ride not found...");
    const {
      fromCity,
      toCity,
      date,
      time,
      availableSeats,
      fromLocation,
      toLocation,
      totalSeats,
      price,
 
    } = req.body;

    if (
      !fromCity ||
      !toCity ||
      !fromLocation ||
      !toLocation ||
      !date ||
      !time ||
      availableSeats == null ||
      totalSeats == null ||
      price == null 
     
    ) {
      return res.status(400).json({ message: "All Fields are required!" });
    }

    if (availableSeats <= 0 || totalSeats <= 0 || price <= 0) {
      return res.status(400).json({ message: "Invalid ride information!" });
    }

    const { category, model, color, licensePlate, year } = userExists.vehicleDetails;
    if (!category || !model || !color || !licensePlate || !year) {
      return res.status(400).json({ message: "All vehicle details are required!" });
    }

    if (!userExists.isPhoneVerified)
      return res.status(400).json({ message: "Phone number is not verified!" });

    // if (
    //   !userExists.driverDocuments.license.verified ||
    //   !userExists.driverDocuments.idCard.verified ||
    //   userExists.status !== 1
    // ) {
    //   return res.status(400).json({
    //     message:
    //       "Vehicle documents are not verified or document verification status is pending!",
    //   });
    // }

    if (Number(availableSeats) > Number(totalSeats)) {
      return res
        .status(400)
        .json({ message: "Available seats cannot exceed total seats!" });
    }

    const rideData = {
      ...req.body,
      driver: id,
    };

    // Optional: Handle updated ride image
    if (req.files && Object.keys(req.files).length > 0) {
      if (req.files.image && req.files.image[0]?.filename) {
        rideData.image = req.files.image[0].filename;
      }
    }

    const updatedRide = await Rides.findByIdAndUpdate(rideId, rideData, {
      new: true,
    });

    return res.success(updatedRide);
  } catch (error) {
    console.log("ERROR: ", error);
    return res.someThingWentWrong(error);
  }
};

// **
exports.ride_search = async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000 } = req.query;

    let query = {
      status: "active",
    };

    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const maximumDistance = parseFloat(maxDistance);

      if (isNaN(latitude) || isNaN(longitude)) {
        return res
          .status(400)
          .json({ status: false, message: "Invalid lat or lng" });
      }

      query["fromLocation.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: maximumDistance,
        },
      };
    }

    const rides = await Rides.find(query);

    if (!rides || rides.length === 0) return res.noRecords();

    return res.success(rides);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.book_ride = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const user_id = req.user._id;

    const {
      seatsBooked,
      paymentDetails = {},
      paymentMethod = "cash",
    } = req.body;

    const findRide = await Rides.findById(ride_id);

    if (!findRide) return res.noRecords();

    if (findRide.status !== "active")
      return res
        .status(400)
        .json({ message: `Ride status is ${findRide.status}.` });

    const alreadyBooked = findRide.passengers.find(
      (p) => p.user.toString() === user_id.toString()
    );

    if (alreadyBooked)
      return res
        .status(400)
        .json({ message: "User already booked this ride." });

    if (!seatsBooked || seatsBooked < 1)
      return res
        .status(400)
        .json({ message: "Invalid seat booking information." });

    if (findRide.availableSeats < seatsBooked)
      return res
        .status(400)
        .json({ message: `Only ${findRide.availableSeats} seats available.` });

    const driver_id = findRide.driver;

    const totalPrice = seatsBooked * findRide.price;

    const paymentStatus =
      paymentDetails &&
      typeof paymentDetails === "object" &&
      paymentDetails.paidAt
        ? "completed"
        : "pending";

    findRide.passengers.push({
      user: user_id,
      seatsBooked,
      totalPrice,
      paymentStatus,
      paymentMethod,
    });

    await findRide.save();

    const data = {
      ride: ride_id,
      passenger: user_id,
      driver: driver_id,
      seatsBooked,
      totalPrice,
      paymentMethod,
      paymentDetails,
    };

    let razorpayOrder = null;

    if (paymentMethod === "online") {
      razorpayOrder = await createRazorpayOrder(ride_id, totalPrice);
      data.paymentDetails.transactionId = razorpayOrder.id;
      await Payment.create({
        user_id,
        entity_id: ride_id,
        razorpay_order_id: razorpayOrder?.id,
        razorpay_payment_id: null,
        payment_status: paymentStatus,
        amount: totalPrice,
        payment_date: new Date(),
      });
    }
    const results = await Booking.create(data);
    const user = await User.findById(user_id);
    await sendMail({
      to: user.email,
      subject: "Ride Booking Confirmation",
      text: `Hi ${user.name}, your booking for the ride has been confirmed.`,
      html: `
            <h2>Hi ${user.name},</h2>
            <p>✅ Your booking for <strong>${seatsBooked}</strong> seat(s) has been successfully confirmed.</p>
            <p><strong>Ride ID:</strong> ${ride_id}</p>
            <p><strong>Total Paid:</strong> ₹${totalPrice} paymentStatus <strong> :  ${paymentMethod} </strong></p>
            <p>look forward to serving </p>
            <br/>
            <p>Regards,<br/>${process.env.MAIL_FROM_NAME}</p>
          `,
    });
    // console.log("user",user.email)
    return res.success(results);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.get_all_booked_rides_by_driver_id = async (req, res) => {
  try {
    let user = req.user;
    let { id } = req.params;
    if (!id) id = user._id;
    const ride = await Rides.find({ driver: id });
    if (!ride) return res.noRecords();
    return res.success(ride);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.booking_status = async (req, res) => {
  try {
    const { id } = req.params;
    const results = await Booking.aggregate([
      { $match: { driver: new mongoose.Types.ObjectId(id) } },
      {
        $facet: {
          pending: [{ $match: { status: "pending" } }],
          confirmed: [{ $match: { status: "confirmed" } }],
          ongoing: [{ $match: { status: "ongoing" } }],
          cancelled: [{ $match: { status: "cancelled" } }],
          completed: [{ $match: { status: "completed" } }],
        },
      },
    ]);
    if (!results || results.length === 0) return res.noRecords();
    return res.success(results[0]); // results[0] contains the grouped data
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.booking_by_status = async (req, res) => {
  try {
    const { id, status = "pending" } = req.params;

    const results = await Booking.aggregate([
      { $match: { driver: new mongoose.Types.ObjectId(id), status } },
      // {
      //   $facet: {
      //     pending: [{ $match: { status: "pending" } }],
      //     confirmed: [{ $match: { status: "confirmed" } }],
      //     ongoing: [{ $match: { status: "ongoing" } }],
      //     cancelled: [{ $match: { status: "cancelled" } }],
      //     completed: [{ $match: { status: "completed" } }],
      //   },
      // },
    ]);
    if (!results || results.length === 0) return res.noRecords();
    return res.success(results);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
// exports.status_change_for_bookings = async (req, res) => {
//   try {
//     const { ride_id } = req.params;
//     const { status, cancellationReason = "", cancelledBy = null } = req.body;
//     // Validate ride_id
//     if (!mongoose.Types.ObjectId.isValid(ride_id)) {
//       return res.status(400).json({ message: "Invalid ride ID" });
//     }
//     if (!status) {
//       return res
//         .status(400)
//         .json({ message: "No status information provided." });
//     }
//     // Find all bookings for the ride
//     const bookings = await Booking.find({ ride: ride_id });
//     if (!bookings.length) return res.noRecords();
//     // Update each booking
//     for (let booking of bookings) {
//       booking.status = status;
//       if (status === "cancelled") {
//         booking.cancellationReason = cancellationReason;
//         booking.cancelledBy = cancelledBy;
//         booking.cancelledAt = new Date().toISOString();
//       }
//       await booking.save();
//     }
//     return res.success(bookings);
//   } catch (error) {
//     return res.someThingWentWrong(error);
//   }
// };
const CANCELLATION_REASONS = {
  USER: [
    "Change of plans",
    "Booked by mistake",
    "Found another ride",
    "Running late",
    "Personal emergency",
  ],
  DRIVER: [
    "Vehicle issues",
    "Emergency situation",
    "Passenger unreachable",
    "Overlapping bookings",
    "Ride route unavailable",
  ],
  SYSTEM: [
    "Auto-cancel due to no confirmation",
    "Payment failed",
    "Ride removed by admin",
  ],
};
// with cancellation reason and cancelledBy
exports.status_change_for_bookings = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const { status, cancellationReason = "", cancelledBy = null } = req.body;

    // Validate ride_id
    if (!mongoose.Types.ObjectId.isValid(ride_id)) {
      return res.status(400).json({ message: "Invalid ride ID" });
    }

    if (!status) {
      return res.status(400).json({ message: "No status information provided." });
    }

    // Optional: Validate cancellation reason if status is 'cancelled'
    if (status === "cancelled") {
      const allReasons = [
        ...CANCELLATION_REASONS.USER,
        ...CANCELLATION_REASONS.DRIVER,
        ...CANCELLATION_REASONS.SYSTEM,
      ];
      if (!cancellationReason || !allReasons.includes(cancellationReason)) {
        return res.status(400).json({
          message: "Invalid or missing cancellation reason.",
          availableReasons: CANCELLATION_REASONS,
        });
      }
    }

    // Find all bookings for the ride
    const bookings = await Booking.find({ ride: ride_id });
    if (!bookings.length) return res.noRecords();

    // Update each booking
    for (let booking of bookings) {
      booking.status = status;
      if (status === "cancelled") {
        booking.cancellationReason = cancellationReason;
        booking.cancelledBy = cancelledBy;
        booking.cancelledAt = new Date().toISOString();
      }
      await booking.save();
    }

    return res.success(bookings);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.verify_payment = async (req, res) => {
  try {
    const { booking_id, status = "completed" } = req.params;

    const booking = await Booking.findOne({
      _id: new mongoose.Types.ObjectId(booking_id),
    });

    if (!booking) {
      return res.noRecords("Booking not found");
    }

    booking.paymentStatus = status;
    await booking.save();

    return res.success(booking);
  } catch (error) {
    console.log("Error verifying payment:", error);
    return res.someThingWentWrong(error);
  }
};
// **
exports.status_change_for_rides = async (req, res) => {
  try {
    const { ride_id, status: statusFromParams } = req.params;
    const { status: statusFromBody } = req.body;

    const status = statusFromBody || statusFromParams;

    console.log("ride_id from params:", ride_id);
    console.log("status received:", status);

    // Validate status
    if (!status || !["active", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid or missing status.",
      });
    }

    // Validate ride_id format
    if (!mongoose.Types.ObjectId.isValid(ride_id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid ride ID format.",
      });
    }

    // Find the ride
    const existingRide = await Rides.findById(ride_id);
    if (!existingRide) {
      return res.status(404).json({
        status: false,
        message: "No record found.",
        data: [],
      });
    }

    // Update and save
    existingRide.status = status;
    await existingRide.save();

    return res.status(200).json({
      status: true,
      message: "Ride status updated successfully",
      data: existingRide,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
// **
exports.getAllRides = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = -1,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection === "1" ? 1 : -1;
    let filters = { deletedAt: null };
    const searchStage = query
      ? {
          $or: [
            { "passengerDetails.name": { $regex: query, $options: "i" } },
            { "passengerDetails.phone": { $regex: query, $options: "i" } },
            { "driverDetails.name": { $regex: query, $options: "i" } },
            { "driverDetails.phone": { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const pipeline = [
      {
        $match: filters,
      },
      {
        $lookup: {
          from: "users",
          localField: "passengers.user",
          foreignField: "_id",
          as: "passengerDetails",
        },
      },
      // { $unwind: "$passengerDetails" , preserveNullAndEmptyArrays: true },
      {
        $lookup: {
          from: "users",
          localField: "driver",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      { $unwind: "$driverDetails" },
      { $match: searchStage },
      { $sort: { [orderBy]: sortOrder } },
      {
        $facet: {
          data: [{ $skip: Number(skip) }, { $limit: Number(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const results = await Rides.aggregate(pipeline);
    const rides = results[0]?.data || [];
    const count = results[0]?.totalCount[0]?.count || 0;

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      status: true,
      message: "Success",
      data: {
        record: rides,
        count,
        current_page: Number(pageNo),
        totalPages,
        pagination: Array.from({ length: totalPages }, (_, i) => i + 1),
      },
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.getAllBookings = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = "desc",
      status = null,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection.toLowerCase() === "asc" ? 1 : -1;
    const filters = { deletedAt: null };

    if (status) {
      filters.status = status;
    }

    const searchStage = query
      ? {
          $or: [
            { "passengerDetails.name": { $regex: query, $options: "i" } },
            { "passengerDetails.phone": { $regex: query, $options: "i" } },
            { "driverDetails.name": { $regex: query, $options: "i" } },
            { "driverDetails.phone": { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const pipeline = [
      { $match: filters },

      {
        $lookup: {
          from: "users",
          localField: "passenger",
          foreignField: "_id",
          as: "passengerDetails",
        },
      },
      {
        $unwind: {
          path: "$passengerDetails",
          preserveNullAndEmptyArrays: true, // 🟢 Added this
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "driver",
          foreignField: "_id",
          as: "driverDetails",
        },
      },
      {
        $unwind: {
          path: "$driverDetails",
          preserveNullAndEmptyArrays: true, // ✅ Already correct
        },
      },

      { $match: searchStage },
      { $sort: { [orderBy]: sortOrder } },

      {
        $facet: {
          data: [{ $skip: Number(skip) }, { $limit: Number(limit) }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const results = await Booking.aggregate(pipeline);

    const bookings = results[0]?.data || [];

    const count = results[0]?.totalCount[0]?.count || 0;

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      status: true,
      message: "Success",
      data: {
        record: bookings,
        count,
        current_page: Number(pageNo),
        totalPages,
        pagination: Array.from({ length: totalPages }, (_, i) => i + 1),
      },
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.customer_review = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("user", id );
    const { rating, comment, ride_id } = req.body;
    console.log("rating", rating, "comment", comment, "ride_id", ride_id);
    if (!id || !ride_id)
      return res.status(400).json({ message: "All fields are required." });
    const user = await Users.findById(id);
    // console.log("user", user );
    if (!user) return res.noRecords();
    const booking = await Booking.findOne({
      $or: [{ driver: id }, { passenger: id }],
      ride: ride_id,
      status: "completed",
    });
    if (!booking) return res.noRecords();
    // if already reviewed
    if (
      user.role === "passenger" &&
      (booking.reviewByPassenger.rating || booking.reviewByPassenger.comment)
    )
      return res
        .status(400)
        .json({ message: "You already reviewed the ride!", user: user.role });
    if (
      user.role === "driver" &&
      (booking.reviewByDriver.rating || booking.reviewByDriver.comment)
    )
      return res
        .status(400)
        .json({ message: "You already reviewed the ride!", user: user.role });
    if (user.role === "passenger") {
      booking.reviewByPassenger = {
        rating: rating,
        comment: comment,
        createdAt: new Date().toISOString(),
      };
      console.log("booking.reviewByPassenger", booking.reviewByPassenger);
    } else {
      booking.reviewByDriver = {
        rating: rating,
        comment: comment,
        createdAt: new Date().toISOString(),
      };
      console.log("booking.reviewByDriver", booking.reviewByDriver);
    }
    await booking.save();
    const reviewedUserId =
      user.role === "passenger" ? booking.driver : booking.passenger;
    const reviewedUser = await Users.findById(reviewedUserId);
    if (!reviewedUser) return res.noRecords();
    reviewedUser.reviews.push({
      userId: id,
      rating,
      comment,
      createdAt: new Date(),
    });
    reviewedUser.totalRatings += 1;
    const total = reviewedUser.reviews.reduce((sum, r) => sum + r.rating, 0);
    reviewedUser.rating = total / reviewedUser.reviews.length;

    await reviewedUser.save();
    return res.success({ message: "Thanks for Your feedback." });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
// **
exports.deleteRide = async (req, res) => {
  try {
    const deleted = await ride.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ status: false, message: "Ride not found" });
    res.status(200).json({ status: true, message: "Ride  deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ status: false, message: "Deletion failed", error: err.message });
  }
};

// exports.status_change_for_bookings = async (req, res) => {
//   try {
//     const { ride_id } = req.params;
//     const { status, cancellationReason = "", cancelledBy = null } = req.body;
//     const existingBooking = await Booking.findOne({ ride: ride_id });
//     if (!existingBooking) return res.noRecords();
//     if (!status)
//       return res
//         .status(400)
//         .json({ message: "No status information provided." });
//     existingBooking.status = status;

//     if (status === "cancelled") {
//       existingBooking.cancellationReason = cancellationReason;
//       existingBooking.cancelledBy = cancelledBy;
//       existingBooking.cancelledAt = new Date().toISOString();
//     }
//     await existingBooking.save();
//     return res.success(existingBooking);
//   } catch (error) {
//     return res.someThingWentWrong(error);
//   }
// };
