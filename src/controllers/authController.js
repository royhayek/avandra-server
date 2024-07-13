const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const { sendEmail } = require("../helpers");
require("dotenv").config({ path: ".env" });

const generateJwtToken = (user, res) => {
  const accessToken = jwt.sign(
    {
      UserInfo: {
        email: user.email,
        roles: user.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    let { email, name, image, role, country, password, provider, providerId } = req.body;

    const isSocialSignIn = providerId;
    const isLocalSignIn = email && !providerId;

    if (isLocalSignIn && !password) {
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
      return res.status(400).json({ msg: "The password needs to be at least 5 characters long." });
    }

    // if (!isSocialSignIn && password && password !== passwordCheck) {
    //   return res.status(400).json({ msg: "Enter the same password twice for verification." });
    // }

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
      const { accessToken, refreshToken } = generateJwtToken(existingUser, res);

      return res.status(200).json({
        success: true,
        user: existingUser,
        token: accessToken,
        refreshToken,
        providerId,
        message: "User already exists with this email or providerId",
      });
    }

    const newUser = new User({
      email: email !== null && email !== undefined ? email : undefined,
      name,
      role,
      country,
      provider,
      photo: image,
      providerId: isSocialSignIn && providerId !== null && providerId !== undefined ? providerId : undefined,
    });

    if (!isSocialSignIn && password) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);
      newUser.password = passwordHash;
    }

    const savedUser = await newUser.save();

    const { accessToken, refreshToken } = generateJwtToken(savedUser, res);

    if (isLocalSignIn) {
      try {
        await sendEmail({
          from: '"Avandra" <no-reply@avandraapp.com>',
          to: savedUser.email,
          subject: "Welcome to Our App!",
          text: `Hi ${name}, welcome to our Avandra!`,
        });

        console.error(`User registered and email sent to ${email}!`);
      } catch (error) {
        console.error("Error in user registration or sending email");
      }
    }

    res.status(200).json({
      success: true,
      user: savedUser,
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    console.debug("error", err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "You are already registered with a different provider. Please login with that provider.",
      });
    }

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
    if (!email || !password) return res.status(400).json({ msg: "Not all fields have been entered." });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        success: false,
        data: null,
        message: "No account with this email has been registered.",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid email or password!",
      });

    const { accessToken, refreshToken } = generateJwtToken(user, res);

    res.json({
      success: true,
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (err) {
    console.debug("error", err);
    // res.status(500).json({ success: false, data: null, message: err.message });
    res.status(500).json({ success: false, data: null, message: err.message });
  }
};

exports.refreshToken = (req, res) => {
  let refreshToken;

  console.log("[refreshToken] :: ", req.headers.authorization);
  // Check for token in cookies
  if (req.cookies && req.cookies.jwt) {
    refreshToken = req.cookies.jwt;
  }

  // Check for token in headers if not found in cookies
  if (!refreshToken && req.headers.authorization) {
    refreshToken = req.headers.authorization;
  }

  if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });

    const foundUser = await User.findOne({ username: decoded.username }).exec();

    if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: foundUser.roles,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1m" }
    );

    res.json({ accessToken });
  });
};

exports.checkLoggedIn = async (req, res) => {
  try {
    // If the control reaches here, it means the token is valid
    res.json({ isLoggedIn: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    // Save the token to the user's record (optional, if you want to verify it later)
    user.resetPasswordToken = resetToken;
    await user.save();

    // Send the reset email
    const resetUrl = `http://avandraapp.com/reset-password?token=${resetToken}`;

    await sendEmail({
      from: '"Avandra" <no-reply@avandraapp.com>',
      to: user.email,
      subject: "Password Reset Request",
      text: `Please click the following link to reset your password: ${resetUrl}`,
      // html: `<b>Hi ${name}</b>, welcome to our application!`,
    });

    res.json({ success: true, message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { password, token } = req.body;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    user.password = passwordHash;
    user.resetPasswordToken = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.status(200).json({ message: "Cookie cleared" });
};
