const fs = require("fs");
const path = require("path");
const multer = require("multer");

/**
 * Retrieves a single document by ID.
 * @param {string} req.params.id - The ID of the document.
 * @returns {Document} Single Document
 */
exports.read = async (Model, req, res) => {
  try {
    // Find a document by ID
    const result = await Model.findOne({ _id: req.params.id });
    // If no results are found, return a document not found message
    if (!result) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "No document found with this ID: " + req.params.id,
      });
    } else {
      // Return a success response
      return res.status(200).json({
        success: true,
        result,
        message: "Document found with ID: " + req.params.id,
      });
    }
  } catch (err) {
    // Server Error
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops, there is an error",
    });
  }
};

/**
 * Creates a single document by providing all necessary req.body fields.
 * @param {object} req.body - The request body containing necessary fields.
 * @returns {string} Message
 */
exports.create = async (Model, req, res) => {
  try {
    const modelName = Model.modelName;

    // Creating a new document in the collection
    const result = await new Model(req.body).save();
    console.log(result);
    // Returning a successful response
    return res.status(200).json({
      success: true,
      result,
      message: `${modelName} successfully created`,
    });
  } catch (err) {
    // If an error is thrown by Mongoose due to required validations
    if (err.name == "ValidationError") {
      return res.status(400).json({
        success: false,
        data: null,
        error: err,
        message: "Required fields are not supplied",
      });
    } else {
      // Server Error
      return res.status(500).json({
        success: false,
        data: null,
        message: "Oops, there is an error",
      });
    }
  }
};

/**
 * Creates a single document by providing all necessary req.body fields
 * and handles content type multipart/form-data with image upload.
 * @param {Model} Model - Mongoose model for the document.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response.
 */
exports.createWithImage = async (Model, req, res) => {
  try {
    const modelName = Model.modelName;

    // Set up Multer to handle file uploads
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const destinationFolder = `./public/uploads/${modelName.toLowerCase()}`; // Dynamic path based on the model name
        if (!fs.existsSync(destinationFolder)) {
          fs.mkdirSync(destinationFolder, { recursive: true });
          console.log(`Created "${destinationFolder}" directory.`);
        }
        cb(null, destinationFolder);
      },
      filename: function (req, file, cb) {
        // Generate a unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
          null,
          file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
        );
      },
    });

    const upload = multer({ storage: storage }).single("image");

    // Use Multer middleware to handle the image upload
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    // Creating a new document in the collection
    const result = await new Model({
      ...req.body,
      image: req.file ? req.file.filename : null,
    }).save();

    // Returning a successful response
    return res.status(200).json({
      success: true,
      result,
      message: `${modelName} successfully created`,
    });
  } catch (err) {
    // If an error is thrown by Mongoose due to required validations
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        data: null,
        error: err,
        message: "Required fields are not supplied",
      });
    } else {
      // Server Error
      console.error(err);
      return res.status(500).json({
        success: false,
        data: null,
        message: "Oops, there is an error",
      });
    }
  }
};

/**
 * Updates a single document by providing all necessary req.body fields.
 * @param {object, string} (req.body, req.params.id) - Request body and ID of the document.
 * @returns {Document} Returns the updated document.
 */
exports.update = async (Model, req, res) => {
  try {
    // Find a document by ID and update it with the required fields
    const result = await Model.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      {
        new: true, // Return the new result instead of the old one
        runValidators: true,
      }
    ).exec();

    return res.status(200).json({
      success: true,
      result,
      message: "Document updated with ID: " + req.params.id,
    });
  } catch (err) {
    // If an error is thrown by Mongoose due to required validations
    if (err.name == "ValidationError") {
      return res.status(400).json({
        success: false,
        data: null,
        error: err,
        message: "Required fields are not supplied",
      });
    } else {
      // Server Error
      return res.status(500).json({
        success: false,
        data: null,
        message: "Oops, there is an error",
      });
    }
  }
};

/**
 * Updates a single document by providing all necessary req.body fields
 * and handles content type multipart/form-data with image upload.
 * Removes the old image if there is one.
 * @param {Model} Model - Mongoose model for the document.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response.
 */
exports.updateWithImage = async (Model, req, res) => {
  try {
    const modelName = Model.modelName;

    // Set up Multer to handle file uploads
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const destinationFolder = `./public/uploads/${modelName.toLowerCase()}`;
        if (!fs.existsSync(destinationFolder)) {
          fs.mkdirSync(destinationFolder, { recursive: true });
          console.log(`Created "${destinationFolder}" directory.`);
        }
        cb(null, destinationFolder);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
          null,
          file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
        );
      },
    });

    const upload = multer({ storage: storage }).single("image");

    // Use Multer middleware to handle the image upload
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const { ...updateFields } = req.body;

    // Find the existing document
    const existingDoc = await Model.findById(req.params.id);

    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: `${modelName} not found`,
      });
    }

    // Check if the image is provided in the request
    const updatedImage = req.file ? req.file.filename : existingDoc.image;

    // Remove the old image if a new one is provided
    if (existingDoc.image && req.file) {
      const imagePath = path.join(
        __dirname,
        `../../../public/uploads/${modelName.toLowerCase()}/${
          existingDoc.image
        }`
      );
      fs.unlinkSync(imagePath);
    }

    // Update the existing document with the provided data and new/old image
    const updatedDoc = await Model.findByIdAndUpdate(
      req.params.id,
      {
        ...updateFields,
        image: updatedImage,
      },
      { new: true }
    );

    // Returning a successful response
    return res.status(200).json({
      success: true,
      result: updatedDoc,
      message: `${modelName} successfully updated`,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        data: null,
        error: err,
        message: "Required fields are not supplied",
      });
    } else {
      console.error(err);
      return res.status(500).json({
        success: false,
        data: null,
        message: "Oops, there is an error",
      });
    }
  }
};

/**
 * Deletes a single document by ID and associated image if present.
 * @param {Model} Model - Mongoose model for the document.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response.
 */
exports.delete = async (Model, req, res) => {
  try {
    const modelName = Model.modelName;

    // Find the document by ID
    const document = await Model.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `No ${modelName} found with this ID: ${req.params.id}`,
      });
    }

    // Check if there is an image associated with the document
    if (document.image) {
      // Delete the associated image
      const imagePath = path.join(
        __dirname,
        `../../../public/uploads/${modelName.toLowerCase()}/${document.image}`
      );
      fs.unlinkSync(imagePath);
    }

    // Find the document by ID and delete it
    const result = await Model.findOneAndDelete({ _id: req.params.id }).exec();

    // If no results are found, return a document not found message
    if (!result) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `No ${modelName} found with this ID: ${req.params.id}`,
      });
    } else {
      return res.status(200).json({
        success: true,
        result,
        message: `${modelName} successfully deleted`,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops, there is an error",
    });
  }
};

/**
 * Get all documents of a Model.
 * @param {Object} req.params
 * @returns {Object} Results with pagination
 */
exports.list = async (Model, req, res) => {
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;
  try {
    // Query the database for a list of all results
    const resultsPromise = Model.find()
      .skip(skip)
      .limit(limit)
      .sort({ created: "desc" })
      .populate();
    // Count the total number of documents
    const countPromise = Model.countDocuments();
    // Resolve both promises
    const [result, count] = await Promise.all([resultsPromise, countPromise]);
    // Calculate total pages
    const pages = Math.ceil(count / limit);

    // Get Pagination Object
    const pagination = { page, pages, count };
    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination,
      });
    } else {
      return res.status(203).json({
        success: false,
        data: [],
        pagination,
        message: "Collection is Empty",
      });
    }
  } catch {
    return res
      .status(500)
      .json({ success: false, data: [], message: "Oops, there is an error" });
  }
};

/**
 * Search for documents with specific properties.
 * @param {Object} req.query
 * @returns {Array} List of Documents
 */
exports.search = async (Model, req, res) => {
  if (req.query.q === undefined || req.query.q === "" || req.query.q === " ") {
    return res
      .status(202)
      .json({
        success: false,
        data: [],
        message: "No document found with this request",
      })
      .end();
  }
  const fieldsArray = req.query.fields.split(",");

  const fields = { $or: [] };

  for (const field of fieldsArray) {
    fields.$or.push({
      [field]: { $regex: new RegExp(req.query.q, "i") },
    });
  }

  try {
    let results = await Model.find(fields).sort({ name: "asc" }).limit(10);

    if (results.length >= 1) {
      return res.status(200).json({
        success: true,
        data: results,
      });
    } else {
      return res
        .status(202)
        .json({
          success: false,
          data: [],
          message: "No document found with this request",
        })
        .end();
    }
  } catch {
    return res.status(500).json({
      success: false,
      data: null,
      message: "Oops, there is an error",
    });
  }
};
