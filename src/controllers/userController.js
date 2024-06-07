const mongoose = require("mongoose");

const User = mongoose.model("User");
const Trip = mongoose.model("Trip");
const Message = mongoose.model("Message");
const Device = mongoose.model("Device");

/**
 *  Get all documents of a Model
 *  @param {Object} req.params
 *  @returns {Object} Results with pagination
 */
exports.list = async (req, res) => {
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;
  try {
    //  Query the database for a list of all results
    const resultsPromise = User.find({ _id: { $ne: req.admin._id } })
      .skip(skip)
      .limit(limit)
      .sort({ created: "desc" })
      .populate();
    // Counting the total documents
    const countPromise = User.countDocuments();
    // Resolving both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    // Calculating total pages
    const pages = Math.ceil(count / limit);

    // Getting Pagination Object
    const pagination = { page, pages, count };
    if (count > 0) {
      for (let admin of result) {
        admin.password = undefined;
      }
      return res.status(200).json({
        success: true,
        result,
        pagination,
        message: "Successfully found all documents",
      });
    } else {
      return res.status(203).json({
        success: false,
        data: [],
        pagination,
        message: "Collection is Empty",
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, data: [], message: err.message });
  }
};
exports.profile = async (req, res) => {
  try {
    //  Query the database for a list of all results
    if (!req.admin) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "couldn't found  admin Profile ",
      });
    }
    let result = {
      _id: req.admin._id,
      enabled: req.admin.enabled,
      email: req.admin.email,
      name: req.admin.name,
      surname: req.admin.surname,
    };

    return res.status(200).json({
      success: true,
      result,
      message: "Successfully found Profile",
    });
  } catch {
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops there is an Error",
    });
  }
};

exports.read = async (req, res) => {
  try {
    // Find document by id
    const tmpResult = await User.findOne({
      _id: req.params.id,
    });
    // If no results found, return document not found
    if (!tmpResult) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "No document found by this id: " + req.params.id,
      });
    } else {
      // Return success resposne
      let result = {
        _id: tmpResult._id,
        enabled: tmpResult.enabled,
        email: tmpResult.email,
        name: tmpResult.name,
        surname: tmpResult.surname,
      };

      return res.status(200).json({
        success: true,
        result,
        message: "we found this document by this id: " + req.params.id,
      });
    }
  } catch {
    // Server Error
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops there is an Error",
    });
  }
};

/**
 *  Creates a Single document by giving all necessary req.body fields
 *  @param {object} req.body
 *  @returns {string} Message
 */

exports.create = async (req, res) => {
  try {
    let { email, password } = req.body;

    if ((!email && !providerId) || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Email or providerId (for social media sign-in) or password fields are missing.",
      });
    }

    let existingUser;

    if (email) {
      // If email is provided, check for existing user by email
      existingUser = await User.findOne({ email });
    } else if (providerId) {
      // If providerId is provided, check for existing user by providerId
      existingUser = await User.findOne({ providerId });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `An account already exists with this ${providerId ? "providerId" : "email"}`,
      });
    }

    if (password && password.length < 8) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "The password needs to be at least 8 characters long.",
      });
    }

    var newUser = new User(req.body);
    if (password) {
      const passwordHash = newUser.generateHash(password);
      newUser.password = passwordHash;
    }

    const result = await new User(req.body).save();
    if (!result) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "User couldn't be saved",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: result._id,
        enabled: result.enabled,
        email: result.email,
        name: result.name,
        surname: result.surname,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err });
  }
};

/**
 *  Updates a Single document
 *  @param {object, string} (req.body, req.params.id)
 *  @returns {Document} Returns updated document
 */

exports.update = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the request includes a password field
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          result: null,
          message: "The password needs to be at least 8 characters long.",
        });
      }

      // Handle password update logic
      var user = new User();
      const passwordHash = user.generateHash(password);
      req.body.password = passwordHash;

      const passwordUpdateResult = await User.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { password: passwordHash } },
        { new: true }
      ).exec();

      if (!passwordUpdateResult) {
        return res.status(404).json({
          success: false,
          result: null,
          message: "No User found by this id: " + req.params.id,
        });
      }

      return res.status(200).json({
        success: true,
        result: {
          _id: passwordUpdateResult._id,
          email: passwordUpdateResult.email,
          name: passwordUpdateResult.name,
          role: passwordUpdateResult.role,
        },
        message: "User password updated successfully",
      });
    }

    // Handle user information update logic
    if (email) {
      const existingAdmin = await User.findOne({ email: email });

      if (existingAdmin && existingAdmin._id != req.params.id) {
        return res.status(400).json({
          success: false,
          result: null,
          message: "An account already exists with this email, please use another one.",
        });
      }
    }

    const updatedUser = await User.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true }).exec();

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "No User found by this id: " + req.params.id,
      });
    }

    return res.status(200).json({
      success: true,
      result: updatedUser,
      message: "User information updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Oops there is an Error",
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    let { password } = req.body;

    if (!password) return res.status(400).json({ msg: "Not all fields have been entered." });

    if (password.length < 8)
      return res.status(400).json({
        msg: "The password needs to be at least 8 characters long.",
      });

    // if (password !== passwordCheck)
    //   return res
    //     .status(400)
    //     .json({ msg: "Enter the same password twice for verification." });
    var newAdmin = new User();
    const passwordHash = newAdmin.generateHash(password);
    let updates = {
      password: passwordHash,
    };

    // Find document by id and updates with the required fields
    const result = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updates },
      {
        new: true, // return the new result instead of the old one
      }
    ).exec();
    if (!result) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "No document found by this id: " + req.params.id,
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        _id: result._id,
        enabled: result.enabled,
        email: result.email,
        name: result.name,
        surname: result.surname,
      },
      message: "we update the password by this id: " + req.params.id,
    });
  } catch {
    // Server Error
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops there is an Error",
    });
  }
};

exports.delete = async (req, res) => {
  try {
    let updates = {
      removed: true,
    };
    // Find the document by id and delete it
    const result = await User.findOneAndDelete({ _id: req.params.id }).exec();

    // If no results found, return document not found
    if (!result) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "No User found with this id: " + req.params.id,
      });
    } else {
      // If user was found and deleted, delete all related trips and messages
      await Trip.deleteMany({ user: req.params.id });
      await Message.deleteMany({ user: req.params.id });

      return res.status(200).json({
        success: true,
        result,
        message: "User successfully deleted",
      });
    }
  } catch {
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops there is an Error",
    });
  }
};

exports.search = async (req, res) => {
  // console.log(req.query.q)
  // console.log(req.query.fields)

  try {
    if (req.query.q === undefined || req.query.q === "" || req.query.q === " ") {
      return res
        .status(202)
        .json({
          success: false,
          data: [],
          message: "No document found by this request",
        })
        .end();
    }

    const fieldsArray = req.query.fields.split(",");

    const fields = { $or: [] };

    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, "i") } });
    }
    let result = await User.find(fields).where("removed", false).sort({ name: "asc" }).limit(10);

    if (result.length >= 1) {
      return res.status(200).json({
        success: true,
        result,
        message: "Successfully found all documents",
      });
    } else {
      return res.status(202).json({
        success: false,
        data: [],
        message: "No document found by this request",
      });
    }
  } catch {
    return res.status(500).json({
      success: false,
      data: [],
      message: "Oops there is an Error",
    });
  }
};

exports.deviceInfo = async (req, res) => {
  try {
    const {
      user,
      deviceId,
      pushToken,
      brand,
      osName,
      osVersion,
      modelName,
      deviceName,
      manufacturer,
      deviceYearClass,
    } = req.body;

    if (!user) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "User ID is required",
      });
    }

    const existingDevice = await Device.findOne({ user });

    if (existingDevice) {
      // Update existing device information
      existingDevice.pushToken = pushToken;
      existingDevice.brand = brand;
      existingDevice.osName = osName;
      existingDevice.osVersion = osVersion;
      existingDevice.modelName = modelName;
      existingDevice.deviceName = deviceName;
      existingDevice.manufacturer = manufacturer;
      existingDevice.deviceYearClass = deviceYearClass;

      const updatedDevice = await existingDevice.save();

      return res.status(200).json({
        success: true,
        data: updatedDevice,
        message: "Device information updated successfully",
      });
    } else {
      // Create a new device entry
      const newDevice = new Device({
        user,
        deviceId,
        pushToken,
        brand,
        osName,
        osVersion,
        modelName,
        deviceName,
        manufacturer,
        deviceYearClass,
      });

      const result = await newDevice.save();

      if (!result) {
        return res.status(403).json({
          success: false,
          data: null,
          message: "Device couldn't be saved",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
        message: "Device registered successfully",
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
