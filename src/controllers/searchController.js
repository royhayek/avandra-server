const Search = require("../models/Search");

module.exports.increment = async (req, res) => {
  const lang = req.headers["accept-language"];

  try {
    const { name, country } = req.body;
    const search = await Search.findOne({ name, country });

    if (search) {
      search.count++;
      await search.save();
      return res.status(200).json({ success: true, data: search });
    } else {
      const newSearch = new Search({ name, country, count: 1 });
      await newSearch.save();
      return res.status(201).json({ success: true, data: newSearch });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, data: [], message: "Oops, there is an error" });
  }
};

module.exports.recent = async (req, res) => {
  try {
    const searches = await Search.find().sort({ count: -1 }).limit(10);
    return res.status(200).json({ success: true, data: searches });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, data: [], message: "Oops, there is an error" });
  }
};
