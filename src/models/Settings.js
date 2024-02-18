const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const faqCategorySchema = mongoose.model("FaqCategory").schema;

const settingsSchema = new Schema({
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
