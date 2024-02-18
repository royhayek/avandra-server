const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const languageSchema = mongoose.model("Language").schema;

const travelerSchema = new Schema({
  icon: {
    type: String,
    required: true,
  },
  title: [languageSchema],
  description: [languageSchema],
  enabled: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Traveler", travelerSchema);
