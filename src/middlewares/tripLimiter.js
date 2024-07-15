const User = require("../models/User");

const checkTripLimit = async (req, res, next) => {
  const { user: userId } = req.body; // Assuming user ID is available in the request
  const user = await User.findById(userId);

  if (user.isPremium) {
    return next();
  }

  const today = new Date().setHours(0, 0, 0, 0);
  const lastTripDate = new Date(user.lastTripDate).setHours(0, 0, 0, 0);

  if (lastTripDate < today) {
    user.tripCount = 0;
    user.lastTripDate = today;
  }

  if (user.tripCount >= 3) {
    return res.status(500).json({
      status: 500,
      message: "Daily trip generation limit reached. Please try again tomorrow or upgrade to premium.",
    });
  }

  next();
};

module.exports = checkTripLimit;
