const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const Language = require("./Language");

const faqSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "FaqCategory",
      required: true,
    },
    question: {
      type: [Language.schema],
      required: true,
    },
    answer: {
      type: [Language.schema],
      required: true,
    },
    order: {
      type: Number,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Faq", faqSchema);
