const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const Language = require("./Language");

const interestSchema = new Schema({
  title: {
    type: [Language.schema],
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Interest", interestSchema);
