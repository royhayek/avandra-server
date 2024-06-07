const mongoose = require("mongoose");
const Device = mongoose.model("Device");
const User = mongoose.model("User");
const Trip = mongoose.model("Trip");
const Message = mongoose.model("Message");
const Destination = mongoose.model("Destination");

exports.read = async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    const admins = await User.find({ role: "admin" });
    const destinations = await Destination.find();
    const trips = await Trip.find();
    const unreadMessages = await Message.find({ status: "unread" });
    const devices = await Device.find();

    const data = {
      usersCount: users.length,
      adminsCount: admins.length,
      destinationsCount: destinations.length,
      tripsCount: trips.length,
      unreadMessagesCount: unreadMessages.length,
      devicesCount: devices.length,
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
