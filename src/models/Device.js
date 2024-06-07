const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const deviceSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  deviceId: {
    type: String,
    required: true,
  },
  pushToken: String,
  brand: String,
  osName: String,
  osVersion: String,
  modelName: String,
  deviceName: String,
  manufacturer: String,
  deviceYearClass: Number,
});

module.exports = mongoose.model("Device", deviceSchema);
