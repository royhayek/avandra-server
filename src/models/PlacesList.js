const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const placeSchema = mongoose.model("Place").schema;

const placesListSchema = new Schema({
  date: {
    type: String,
    required: true,
  },
  list: [placeSchema],
});

module.exports = mongoose.model("PlacesList", placesListSchema);
