const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const userSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    sparse: true,
    // required: true,
  },
  password: {
    type: String,
  },
  name: { type: String, required: true },
  photo: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    default: "user",
  },
  country: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  provider: {
    type: String,
    default: "email",
  },
  providerId: {
    type: String,
  },
  isLoggedIn: {
    type: Boolean,
  },
});

// generating a hash
userSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
