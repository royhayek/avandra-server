const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const ItineraryList = require("./ItineraryList");

const tripSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    fromDate: {
      type: String,
      required: true,
    },
    toDate: {
      type: String,
      required: true,
    },
    travelerId: {
      type: Schema.Types.ObjectId,
      ref: "Traveler",
      required: true,
    },
    budgetId: {
      type: Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },
    image: String,
    description: String,
    continent: String,
    currency: String,
    gallery: [String],
    location: {
      latitude: Number,
      longitude: Number,
    },
    itineraries: [ItineraryList.schema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
