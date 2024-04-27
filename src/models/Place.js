const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

// const directionSchema = mongoose.model("Direction").schema;

const placeSchema = new Schema({
  // image: String,
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  coordinates: {
    type: Object,
    required: true,
  },
  description: String,
  internationalPhone: String,
  rating: Number,
  openingHours: Object,
  photoUrl: String,
  userRatingsTotal: Number,
  priceLevel: Number,
  address: {
    type: String,
    required: true,
  },
  // directions: directionSchema,
});

module.exports = mongoose.model("Place", placeSchema);
