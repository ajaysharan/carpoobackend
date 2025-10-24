const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { fetchUserData } = require("../controllers/userController");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization") || req.cookies.token;
    if (!token)
      return res
        .status(401)
        .json({ status: false, message: "Token Not Found..!!" });

    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET_TOKEN_KEY_EMPLOYEE
    );

    const user = await fetchUserData(new mongoose.Types.ObjectId(`${decoded.userId}`));
    if (user.length === 0)
      return res
        .status(401)
        .json({ status: false, message: "Invalid Token..!!" });

    req.user = user[0];
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ status: false, message: error.message || "Invalid Token..!!" });
  }
};
