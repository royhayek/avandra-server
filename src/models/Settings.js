const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const settingsSchema = new Schema({
  language: {
    type: Schema.Types.ObjectId,
    ref: "Language",
  },
  termsAndConditions: {
    type: String,
  },
  privacyPolicy: {
    type: String,
  },
  googlePackageName: {
    type: String,
    required: true,
  },
  appleAppId: {
    type: String,
    required: true,
  },
  smtp: {
    host: {
      type: String,
    },
    port: {
      type: Number,
    },
    secure: {
      type: Boolean,
    },
    username: {
      type: String,
    },
    password: {
      type: String,
    },
    fromEmail: {
      type: String,
    },
  },
});

module.exports = mongoose.model("Settings", settingsSchema);
