const axios = require("axios");
const { urlencoded } = require("express");
const querystring = require('querystring');

module.exports = async (number, otp) => {
  try {
    const message = `Hello User, Your Login Verification Code is ${otp}. Thanks AYT`;
    const encodedMessage = querystring.escape(message);

    const apiKey = process.env.TEXT_LOCAL_KEY;
    const sender = process.env.TEXT_LOCAL_SENDER;

    const url = `https://api.textlocal.in/send?apikey=${apiKey}` +
                `&sender=${sender}` +
                `&numbers=${number}` +
                `&message=${encodedMessage}`;

    const response = await axios.get(url);
    console.log("TextLocal response:", response.data);

    // According to TextLocal API, a successful send returns status === 'success'
    if (response.data && response.data.status === 'success') {
      return true;
    }
    return false;

  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
};
