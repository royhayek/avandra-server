const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const itinerarySchema = mongoose.model("Itinerary").schema;

const itineraryListSchema = new Schema({
  date: {
    type: String,
    required: true,
  },
  list: [itinerarySchema],
});

module.exports = mongoose.model("ItineraryList", itineraryListSchema);
