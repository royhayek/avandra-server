const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const notificationSchema = new Schema({
  language: {
    type: Schema.Types.ObjectId,
    ref: "Language",
    requred: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
