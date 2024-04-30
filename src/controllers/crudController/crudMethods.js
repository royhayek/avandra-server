const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const { generatePopulationOptions } = require("../../helpers");

const Language = mongoose.model("Language");

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
    console.debug("err", err);
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
        const destinationFolder = `./public/uploads/${modelName.toLowerCase()}/${file.fieldname}`;
        if (!fs.existsSync(destinationFolder)) {
          fs.mkdirSync(destinationFolder, { recursive: true });
          console.log(`Created "${destinationFolder}" directory.`);
        }
        cb(null, destinationFolder);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
      },
    });

    const upload = multer({ storage: storage, limits: 100000 }).fields([
      { name: "image", maxCount: 1 },
      { name: "flag", maxCount: 1 },
      { name: "gallery", maxCount: 10 }, // Assuming maxCount is the maximum number of files for the gallery
    ]);

    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    // Creating a new document in the collection

    // Parse JSON fields in req.body (if needed)
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
      for (const key in req.body) {
        if (typeof req.body[key] === "string") {
          try {
            req.body[key] = JSON.parse(req.body[key]);
          } catch (error) {
            // Ignore parsing error, keep the original value
          }
        }
      }
    }

    const result = await new Model({
      ...req.body,
      image: req.files && req.files.image ? req.files.image[0].filename : null,
      flag: req.files && req.files.flag ? req.files.flag[0].filename : null,
      gallery: req.files && req.files.gallery ? req.files.gallery.map((file) => file.filename) : [],
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
    const modelName = Model.modelName;

    // Find a document by ID and update it with the required fields
    const result = await Model.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true, // Return the new result instead of the old one
      runValidators: true,
    }).exec();

    return res.status(200).json({
      success: true,
      result,
      message: `${modelName} updated successfully`,
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

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        let destinationFolder = `./public/uploads/${modelName.toLowerCase()}/${file.fieldname}`;

        if (!fs.existsSync(destinationFolder)) {
          fs.mkdirSync(destinationFolder, { recursive: true });
          console.log(`Created "${destinationFolder}" directory.`);
        }

        cb(null, destinationFolder);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
      },
    });

    const upload = multer({ storage: storage, limits: 100000 }).fields([
      { name: "image", maxCount: 1 },
      { name: "flag", maxCount: 1 },
      { name: "gallery", maxCount: 10 },
    ]);

    // Use Multer middleware to handle the image, flag, and gallery uploads
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    // Parse JSON fields in req.body (if needed)
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
      for (const key in req.body) {
        if (typeof req.body[key] === "string") {
          try {
            req.body[key] = JSON.parse(req.body[key]);
          } catch (error) {
            // Ignore parsing error, keep the original value
          }
        }
      }
    }

    const { ...updateFields } = req.body;

    // Find the existing document
    const existingDoc = await Model.findById(req.params.id);

    if (!existingDoc) {
      return res.status(404).json({
        success: false,
        message: `${modelName} not found`,
      });
    }

    // Check if the image, flag, and gallery are provided in the request
    const updatedImage = req.files && req.files.image ? req.files.image[0].filename : existingDoc.image;
    const updatedFlag = req.files && req.files.flag ? req.files.flag[0].filename : existingDoc.flag;
    const updatedGallery =
      req.files && req.files.gallery ? req.files.gallery.map((file) => file.filename) : existingDoc.gallery;
   
    // Remove the old image, flag, and gallery if new ones are provided
    if (existingDoc.image && req.files && req.files.image && !existingDoc.image.includes("http")) {
      const imagePath = path.join(
        __dirname,
        `../../../public/uploads/${modelName.toLowerCase()}/image/${existingDoc.image}`
      );
      fs.unlinkSync(imagePath);
    }

    if (existingDoc.flag && req.files && req.files.flag && !existingDoc.flag.includes("http")) {
      const flagPath = path.join(
        __dirname,
        `../../../public/uploads/${modelName.toLowerCase()}/flag/${existingDoc.flag}`
      );
      fs.unlinkSync(flagPath);
    }

    if (existingDoc.gallery && req.files && req.files.gallery) {
      existingDoc.gallery.forEach((filename) => {
        console.debug("filename", filename);
        const galleryPath = path.join(
          __dirname,
          `../../../public/uploads/${modelName.toLowerCase()}/gallery/${filename}`
        );
        fs.unlinkSync(galleryPath);
      });
    }

    // Update the existing document with the provided data and new/old image, flag, and gallery
    const updatedDoc = await Model.findByIdAndUpdate(
      req.params.id,
      {
        ...updateFields,
        image: updatedImage,
        flag: updatedFlag,
        gallery: updatedGallery,
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
 * Deletes a single document by ID and associated images if present.
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

    // Check and delete associated images and isn't a link
    if (document.image && !document.image.includes("http")) {
      const imagePath = path.join(
        __dirname,
        `../../../public/uploads/${modelName.toLowerCase()}/image/${document.image}`
      );
      fs.unlinkSync(imagePath);
    }

    if (document.flag && !typeof document.flag === "string" && !document.flag.includes("http")) {
      const flagPath = path.join(__dirname, `../../../public/uploads/${modelName.toLowerCase()}/flag/${document.flag}`);
      fs.unlinkSync(flagPath);
    }

    if (document.gallery && document.gallery.length > 0) {
      document.gallery.forEach((galleryImage) => {
        const galleryPath = path.join(
          __dirname,
          `../../../public/uploads/${modelName.toLowerCase()}/gallery/${galleryImage}`
        );
        fs.unlinkSync(galleryPath);
      });
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
  const lang = req.headers["accept-language"];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.items) || 20;
  const skip = (page - 1) * limit;

  try {
    // Generate population options based on the Model schema
    const populationOptions = generatePopulationOptions(Model);

    const languageId = await Language.findOne({ value: lang });

    // Start the query and dynamically apply population options
    let model = languageId ? Model.find({ language: languageId }) : Model.find();
    let query = model.skip(skip).limit(limit).sort({ created: "desc" });

    // Apply each population option to the query
    populationOptions.forEach((option) => {
      query = query.populate(option.path); // Customize this if needed
    });

    // Execute the query with dynamic population
    const result = await query.exec();
    const count = await Model.countDocuments(languageId ? { language: languageId } : {});

    // Calculate total pages
    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    if (count > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination,
      });
    } else {
      return res.status(204).json({
        success: false,
        data: [],
        pagination,
        message: "Collection is Empty",
      });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ success: false, data: [], message: "Oops, there is an error" });
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
