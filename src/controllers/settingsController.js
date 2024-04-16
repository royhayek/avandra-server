const mongoose = require("mongoose");
const Settings = mongoose.model("Settings");

const methods = require("./crudController");
module.exports = methods.crudController("Settings");

module.exports.privacyPolicy = async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: "privacyPolicy" });

    if (settings) {
      return res.status(200).json({
        success: true,
        data: settings,
      });
    } else {
      return res.status(204).json({
        success: false,
        data: null,
        message: "Privacy Policy Not Found",
      });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops there is an Error",
    });
  }
};
