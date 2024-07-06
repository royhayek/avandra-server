const fs = require("fs");
const path = require("path");
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

exports.images = async (req, res) => {
  try {
    const { imagePath } = req.body;

    const imageDirectory = path.join(__dirname, `../../public/uploads/${imagePath}`);

    // Check if directory exists
    if (!fs.existsSync(imageDirectory)) {
      return res.status(404).json({ error: "Directory not found" });
    }

    fs.readdir(imageDirectory, (err, files) => {
      if (err) {
        console.error("Error reading directory:", err);
        return res.status(500).json({ error: "Unable to scan directory" });
      }

      // Filter to include only image files
      const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|gif)$/.test(file));

      // Map file names to URLs
      // Map file names to URLs with hostname prepended
      const hostname = req.protocol + "://" + req.get("host");
      const imageUrls = imageFiles.map((file) => ({ name: file, url: `${hostname}/uploads/${imagePath}/${file}` }));

      res.json({
        success: true,
        data: imageUrls,
      });
    });
  } catch (err) {
    console.debug(err);

    // Server Error
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops there is an Error",
    });
  }
};
