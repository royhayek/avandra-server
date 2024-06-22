const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

// const directionSchema = mongoose.model("Direction").schema;

const placeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  coordinates: {
    type: Object,
    required: true,
  },
  displayName: String,
  description: String,
  internationalPhone: String,
  rating: Number,
  reviews: Array,
  website: String,
  types: Array,
  openingHours: Object,
  photoUrl: String,
  photos: Array,
  userRatingsTotal: Number,
  priceLevel: Number,
  address: {
    type: String,
    required: true,
  },
  // directions: directionSchema,
});

module.exports = mongoose.model("Place", placeSchema);
