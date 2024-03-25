const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const walkthroughSchema = new Schema({
  language: {
    type: Schema.Types.ObjectId,
    ref: "Language",
    requred: true,
  },
  image: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Walkthrough", walkthroughSchema);
