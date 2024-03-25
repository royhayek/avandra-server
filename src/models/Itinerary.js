const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const directionSchema = mongoose.model("Direction").schema;

const itinerarySchema = new Schema({
  language: {
    type: Schema.Types.ObjectId,
    ref: "Language",
  },
  image: String,
  name: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  estimatedCost: Number,
  rating: Number,
  reviews: Number,
  type: {
    type: String,
    required: true,
  },
  directions: directionSchema,
});

module.exports = mongoose.model("Itinerary", itinerarySchema);
