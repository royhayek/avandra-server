const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const languageSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    rtl: {
      type: Boolean,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { typePojoToMixed: false }
);

module.exports = mongoose.model("Language", languageSchema);
