const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const directionSchema = mongoose.model("Direction").schema;

const itinerarySchema = new Schema({
  image: String,
  name: String,
  time: String,
  estimatedCost: Number,
  rating: Number,
  reviews: Number,
  type: String,
  directions: directionSchema,
});

module.exports = mongoose.model("Itinerary", itinerarySchema);
