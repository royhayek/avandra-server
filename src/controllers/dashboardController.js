const User = require("../models/User");
const Trip = require("../models/Trip");
const Device = require("../models/Device");
const Message = require("../models/Message");
const Article = require("../models/Article");
const Destination = require("../models/Destination");

exports.read = async (req, res) => {
  try {
    const users = await User.find({ role: "user" });
    const admins = await User.find({ role: "admin" });
    const destinations = await Destination.find();
    const trips = await Trip.find();
    const articles = await Article.find();
    const unreadMessages = await Message.find({ status: "unread" });
    const devices = await Device.find();

    // retrieve device brands uniquely with their counts
    const deviceBrands = await Device.aggregate([
      {
        $group: {
          _id: "$brand",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const data = {
      deviceBrands,
      usersCount: users.length,
      tripsCount: trips.length,
      adminsCount: admins.length,
      devicesCount: devices.length,
      articlesCount: articles.length,
      destinationsCount: destinations.length,
      unreadMessagesCount: unreadMessages.length,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    // Server Error
    return res.status(500).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
};
