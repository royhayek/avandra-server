const mongoose = require("mongoose");
const Language = mongoose.model("Language");

exports.read = async (req, res) => {
  try {
    const languages = await Language.find();

    const data = {
      languages: languages,
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
