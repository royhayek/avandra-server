const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const Language = require("./Language");

const articleSchema = new Schema({
  name: {
    type: [Language.schema],
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  details: {
    type: [Language.schema],
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Article", articleSchema);
