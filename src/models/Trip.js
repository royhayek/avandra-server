const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const ItineraryList = require("./ItineraryList");

const tripSchema = new Schema(
  {
    language: {
      type: Schema.Types.ObjectId,
      ref: "Language",
      requred: true,
    },
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
    traveler: {
      type: Schema.Types.ObjectId,
      ref: "Traveler",
      required: true,
    },
    budget: {
      type: Schema.Types.ObjectId,
      ref: "Budget",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    status: {
      type: String,
      required: true,
      enum: ["active", "upcoming", "expired"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
