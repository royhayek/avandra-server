const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const destinationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  country: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Destination", destinationSchema);
