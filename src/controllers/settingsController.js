const Settings = require("../models/Settings");

const methods = require("./crudController");
module.exports = methods.crudController(require("../models/Settings"));

module.exports.config = async (req, res) => {
  try {
    const settings = await Settings.findOne().select([
      "privacyPolicy",
      "termsAndConditions",
      "appleAppId",
      "googlePackageName",
    ]);

    if (settings) {
      return res.status(200).json({
        success: true,
        data: settings,
      });
    } else {
      return res.status(204).json({
        success: false,
        data: null,
        message: "Config Not Found",
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

module.exports.privacyPolicy = async (req, res) => {
  try {
    const settings = await Settings.findOne().select("privacyPolicy");
    console.debug("settings", settings);

    if (settings) {
      return res.status(200).json({
        success: true,
        data: settings.privacyPolicy,
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
