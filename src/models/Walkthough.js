const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const languageSchema = mongoose.model("Language").schema;

const walkthroughSchema = new Schema({
  image: {
    type: String,
    required: true,
  },
  title: {
    type: [languageSchema],
    required: true,
  },
  description: {
    type: [languageSchema],
    required: true,
  },
});

module.exports = mongoose.model("Walkthrough", walkthroughSchema);
