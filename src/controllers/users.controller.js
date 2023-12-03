const { errorHandler } = require("../util");
const models = require("../models");
const { HttpError } = require("../error");
const bcrypt = require("bcrypt");
const argon2 = require("argon2");

const getAllUsers = errorHandler(async (req, res) => {
  try {
    const users = await models.User.find({ _id: { $ne: req.userId } });
    res.json(users);
  } catch (error) {
    res.json(error);
  }
});

const me = errorHandler(async (req, res) => {
  const userDoc = await models.User.findById(req.userId).exec();
  if (!userDoc) {
    throw new HttpError(400, "User not found");
  }
  return userDoc;
});

const update = errorHandler(async (req, res) => {
  const user = await models.User.findById(req.body._id);
  var body = req.body;

  if (body.currentPassword) {
    const isMatch = await argon2.verify(user.password, body.currentPassword);

    if (!isMatch) {
      throw new HttpError(400, "Current password is wrong!");
    }

    // if not error and password matched then we will hash password
    const newPassword = await argon2.hash(body.password);

    user.password = newPassword;
  }

  user.status = body.status;
  user.role = body.role;
  user.name = body.name;
  user.email = body.email;

  await user.save();

  const updatedUser = await models.User.findById(req.body._id);
  updatedUser.password = undefined;

  if (req.userId === req.body._id) {
    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    };
  } else {
    return {
      success: true,
      message: "User updated successfully",
    };
  }
});

const deleteUser = errorHandler(async (req, res) => {
  const { _id } = req.body;
  const user = await models.User.findByIdAndDelete(_id);
  if (!user) {
    return res.status(400).json("User not found");
  }

  return {
    success: true,
    message: "User deleted successfully",
  };
});

module.exports = {
  me,
  update,
  getAllUsers,
  deleteUser,
};
