const { check } = require("express-validator");

module.exports = (method) => {
  switch (method) {
    case "client":
      return [
        check("name", "name required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
        check("dob", "date of birth required.!!")
          .exists()
          .not()
          .isEmpty()
          .isDate()
          .withMessage("Invalid date received.")
          .toDate(),
        check("city", "city required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
        check("phone", "phone required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 50 }),
        check("email", "email required.!!")
          .exists()
          .not()
          .isEmpty()
          .isEmail()
          .isLength({ min: 2, max: 100 }),
        check("car_name", "car name required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
        check("service_coupon", "service coupon required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 })
          .optional({ nullable: true }),
        check("city", "city required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
        check("country", "country required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
        check("city", "city required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
        check("date_time", "date_time required.!!")
          .exists()
          .not()
          .isEmpty()
          .isDate()
          .withMessage("Invalid date received.")
          .toDate(),
      ];

    case "register":
      return [
        check("fullname", "name required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
        check("email", "email required.!!")
          .exists()
          .not()
          .isEmpty()
          .isEmail()
          .isLength({ min: 2, max: 100 }),
        check("password", "password required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 8, max: 50 }),
      ];

    case "customer":
      return [
        check("name", "Name is required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 50 }),
        check("phone", "Phone is required.!!")
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 10, max: 10 })
          .withMessage("Invalid mobile number!"),
      ];

    case "forgot-password":
      return [
        check("email", "email required.!!")
          .exists()
          .not()
          .isEmpty()
          .isEmail()
          .isLength({ min: 2, max: 100 }),
      ];

    case "role":
      return [
        check(
          "roleName",
          "Role name required and should be between 2 to 50 characters."
        )
          .exists()
          .not()
          .isEmpty()
          .isLength({ min: 2, max: 100 }),
      ];

    default:
      {
        return [];
      }
      break;
  }
};
