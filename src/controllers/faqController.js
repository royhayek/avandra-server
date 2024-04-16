const mongoose = require("mongoose");
const Faq = mongoose.model("Faq");
const Language = mongoose.model("Language");

const { generatePopulationOptions } = require("../helpers");
const methods = require("./crudController");
module.exports = methods.crudController("Faq");

module.exports.list = async (req, res) => {
  const lang = req.headers["accept-language"];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.items) || 20;
  const skip = (page - 1) * limit;

  try {
    // Generate population options based on the Model schema
    const populationOptions = generatePopulationOptions(Faq);

    const languageId = await Language.findOne({ value: lang });

    // Start the query and dynamically apply population options
    let model = languageId
      ? Faq.find({ language: languageId, category: req.params.id })
      : Faq.find({ category: req.params.id });
    let query = model.skip(skip).limit(limit).sort({ created: "desc" });

    // Apply each population option to the query
    populationOptions.forEach((option) => {
      query = query.populate(option.path); // Customize this if needed
    });

    // Execute the query with dynamic population
    const result = await query.exec();
    const count = await Faq.countDocuments(
      languageId
        ? { language: languageId, category: req.params.id }
        : { category: req.params.id }
    );

    // Calculate total pages
    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination,
      });
    } else {
      return res.status(204).json({
        success: false,
        data: [],
        pagination,
        message: "Collection is Empty",
      });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res
      .status(500)
      .json({ success: false, data: [], message: "Oops, there is an error" });
  }
};
