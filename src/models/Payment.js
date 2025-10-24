const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true ,index: true},
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }, // ID of ride
    razorpay_order_id: { type: String, required: true,  },
    razorpay_payment_id: { type: String ,index: true},
    payment_status: { type: String, enum: ["pending", "success", "failed", "refund"], default: "pending" },
    amount: { type: Number, required: true },
    payment_date: { type: Date },
});
 
const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;