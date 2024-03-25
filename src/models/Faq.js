const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const faqSchema = new Schema(
  {
    language: {
      type: Schema.Types.ObjectId,
      ref: "Language",
      requred: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "FaqCategory",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faq", faqSchema);
