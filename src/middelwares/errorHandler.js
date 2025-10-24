const errorMessages = require("../languages/english");

module.exports = (err, req, res, next) => {
  if (err instanceof Error) {
    return res.status(422).json({
      status: false,
      message: err?.message || errorMessages.SOMETHING_WENT_WRONG,
      data: err.message,
    });
  }

  next(err);
};
