const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String },
  image: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  },
  country: { type: String },
  status: { type: Boolean, default: true },
  provider: { type: String, default: "email" },
});

const User = model("User", userSchema);

module.exports = User;
