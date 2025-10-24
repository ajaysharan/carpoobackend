const razorpay = require("./razorpay");

const createRazorpayOrder = async (orderId, planPrice) => {
  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: planPrice * 100,
      currency: "INR",
      receipt: orderId,
      payment_capture: 1,
      notes: {
        purchase_id: orderId.toString(),
        type: "ride",    
      },
    });
    return razorpayOrder;
  } catch (error) {
    throw new Error("Failed to create Razorpay order");
  }
};

module.exports = { createRazorpayOrder };
