const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const directionSchema = new Schema({
  byCar: String,
  byTrain: String,
  byWalk: String,
  byPlane: String,
});

module.exports = mongoose.model("Direction", directionSchema);
