const mongoose = require("mongoose");
const Language = require("./Language");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const destinationSchema = new Schema(
  {
    name: {
      type: [Language.schema],
      required: true,
    },
    description: {
      type: [Language.schema],
    },
    image: {
      type: String,
    },
    country: {
      type: [Language.schema],
      required: true,
    },
    flag: {
      type: String,
    },
    continent: {
      type: [Language.schema],
      required: true,
    },
    currency: {
      type: [Language.schema],
      required: true,
    },
    gallery: {
      type: [String],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Destination", destinationSchema);
