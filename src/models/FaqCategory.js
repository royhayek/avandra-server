const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const Language = require("./Language");

const faqCategorySchema = new Schema(
  {
    name: {
      type: [Language.schema],
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FaqCategory", faqCategorySchema);
