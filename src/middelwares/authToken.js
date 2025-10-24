const jwt = require("jsonwebtoken");
const { Admin } = require("../models");

module.exports = async (req, res, next) => {
 
  const rawToken = req?.cookies?.accessToken || req?.header("Authorization");

  if (!rawToken) {
    return res.status(401).json({ status: false, message: "Token Not Found..!!" });
  }

  try {
    //  console.log("rawToken", process.env.JWT_SECRET_TOKEN_KEY)

    //  console.log("TOKEN ", rawToken)

    const token = rawToken.replace("Bearer ", "");
   
    const decoded =  jwt.verify(token, process.env.JWT_SECRET_TOKEN_KEY);
    //  console.error("decoded", decoded); 
    const user = await Admin.findOne({ _id: decoded.userId, deletedAt: null }).populate("role");

    if (!user) {
      return res.status(401).json({ status: false, message: "Invalid Token..!!" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message); // more specific error
    return res.status(401).json({ status: false, message: "Invalid Token..!!" });
  }
};
