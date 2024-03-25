const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const faqCategorySchema = mongoose.model("FaqCategory").schema;

const settingsSchema = new Schema({
  language: {
    type: Schema.Types.ObjectId,
    ref: "Language",
    requred: true,
  },
  termsAndConditions: {
    type: String,
    required: true,
  },
  privacyPolicy: {
    type: String,
    required: true,
  },
  faqs: [faqCategorySchema],
});

module.exports = mongoose.model("Settings", settingsSchema);
