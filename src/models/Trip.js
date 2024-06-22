const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const PlacesList = require("./PlacesList");

const tripSchema = new Schema(
  {
    language: {
      type: Schema.Types.ObjectId,
      ref: "Language",
      requred: true,
    },
    flag: String,
    payload: {
      name: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      traveler: {
        type: Schema.Types.ObjectId,
        ref: "Traveler",
        required: true,
      },
      fromDate: String,
      toDate: String,
      byDate: {
        type: Boolean,
        required: true,
      },
      selectedMonth: {
        type: String,
      },
      duration: {
        type: Number,
        required: true,
      },
      interests: {
        type: String,
        required: true,
      },
      budget: {
        type: Schema.Types.ObjectId,
        ref: "Budget",
        required: true,
      },
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: String,
    imagePath: String,
    tips: [String],
    description: String,
    continent: String,
    currency: String,
    gallery: [String],
    location: {
      type: Object,
      required: true,
    },
    places: [PlacesList.schema],
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
