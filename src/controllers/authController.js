const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const mongoose = require("mongoose");

const User = mongoose.model("User");

require("dotenv").config({ path: ".env" });

const generateJwtToken = (id) =>
  jwt.sign(
    {
      id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 10, // Set token expiration (e.g., 10 days)
    },
    process.env.JWT_SECRET
  );

exports.register = async (req, res) => {
  try {
    let {
      email,
      name,
      image,
      role,
      gender,
      password,
      passwordCheck,
      provider,
      providerId,
    } = req.body;

    const isSocialSignIn = providerId;
    const isLocalSignIn = email && !providerId;

    if (isLocalSignIn && (!password || !passwordCheck)) {
      return res.status(400).json({
        msg: "Email is required, and not all fields have been entered.",
      });
    }

    if (isSocialSignIn && !providerId) {
      return res.status(400).json({
        msg: "ProviderId is required, and not all fields have been entered.",
      });
    }

    if (!isSocialSignIn && password && password.length < 5) {
      return res
        .status(400)
        .json({ msg: "The password needs to be at least 5 characters long." });
    }

    if (!isSocialSignIn && password && password !== passwordCheck) {
      return res
        .status(400)
        .json({ msg: "Enter the same password twice for verification." });
    }

    let existingUser;

    if (isLocalSignIn) {
      // If email is provided, check for existing user by email
      existingUser = await User.findOne({ email: email });
    } else if (isSocialSignIn) {
      // If providerId is provided, check for existing user by providerId
      existingUser = await User.findOne({ providerId: providerId });
    }

    if (existingUser) {
      // If the user already exists, generate a new access token and include it in the response
      const token = generateJwtToken(existingUser._id);

      return res.status(200).json({
        success: true,
        user: existingUser,
        token,
        providerId,
        message: "User already exists with this email or providerId",
      });
    }

    const newUser = new User({
      email: email !== null && email !== undefined ? email : undefined,
      name,
      role,
      gender,
      provider,
      photo: image,
      providerId:
        isSocialSignIn && providerId !== null && providerId !== undefined
          ? providerId
          : undefined,
    });

    if (!isSocialSignIn && password) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);
      newUser.password = passwordHash;
    }

    const savedUser = await newUser.save();

    const token = generateJwtToken(savedUser._id);

    res.status(200).json({
      success: true,
      user: savedUser,
      token,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validate
    if (!email || !password)
      return res.status(400).json({ msg: "Not all fields have been entered." });

    const admin = await User.findOne({ email: email });
    // console.log(admin);
    if (!admin)
      return res.status(400).json({
        success: false,
        data: null,
        message: "No account with this email has been registered.",
      });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid credentials.",
      });

    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        id: admin._id,
      },
      process.env.JWT_SECRET
    );

    const result = await User.findOneAndUpdate(
      { _id: admin._id },
      { isLoggedIn: true },
      {
        new: true,
      }
    ).exec();

    res.json({
      success: true,
      data: {
        token,
        admin: {
          _id: result._id,
          name: result.name,
          role: result.role,
          email: result.email,
          isLoggedIn: result.isLoggedIn,
        },
      },
      message: "Successfully login admin",
    });
  } catch (err) {
    // res.status(500).json({ success: false, data: null, message: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
};

exports.checkLoggedIn = async (req, res) => {
  try {
    // If the control reaches here, it means the token is valid
    res.json({ isLoggedIn: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
};

exports.isValidToken = async (req, res, next) => {
  try {
    const token = req.header("x-auth-token");
    if (!token)
      return res.status(401).json({
        success: false,
        data: null,
        message: "No authentication token, authorization denied.",
        jwtExpired: true,
      });

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified)
      return res.status(401).json({
        success: false,
        data: null,
        message: "Token verification failed, authorization denied.",
        jwtExpired: true,
      });

    const admin = await User.findOne({ _id: verified.id });
    if (!admin)
      return res.status(401).json({
        success: false,
        data: null,
        message: "Admin doens't Exist, authorization denied.",
        jwtExpired: true,
      });

    if (admin.isLoggedIn === false)
      return res.status(401).json({
        success: false,
        data: null,
        message: "Admin is already logout try to login, authorization denied.",
        jwtExpired: true,
      });
    else {
      req.admin = admin;
      // console.log(req.admin);
      next();
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: err.message,
      jwtExpired: true,
    });
  }
};

exports.logout = async (req, res) => {
  const result = await User.findOneAndUpdate(
    { _id: req.admin._id },
    { isLoggedIn: false },
    {
      new: true,
    }
  ).exec();

  res.status(200).json({ isLoggedIn: result.isLoggedIn });
};
