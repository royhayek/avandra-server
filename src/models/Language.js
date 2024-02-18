const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const languageSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, { typePojoToMixed: false });

module.exports = mongoose.model("Language", languageSchema);
