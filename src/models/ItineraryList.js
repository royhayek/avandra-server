const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const itinerarySchema = mongoose.model("Itinerary").schema;

const itineraryListSchema = new Schema({
  language: {
    type: Schema.Types.ObjectId,
    ref: "Language",
  },
  date: {
    type: String,
    required: true,
  },
  list: [itinerarySchema],
});

module.exports = mongoose.model("ItineraryList", itineraryListSchema);
