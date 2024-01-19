const mongoose = require("mongoose");
const User = mongoose.model("User");
const Destination = mongoose.model("Destination");

exports.read = async (req, res) => {
  try {
    const users = await User.find();
    const destinations = await Destination.find();

    const data = {
      usersCount: users.length,
      destinationsCount: destinations.length,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch {
    // Server Error
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops there is an Error",
    });
  }
};
