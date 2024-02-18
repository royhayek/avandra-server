const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const contactSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["complaint", "inquiry", "suggestion"],
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
