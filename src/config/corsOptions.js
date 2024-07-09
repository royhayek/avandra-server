// Import the allowedOrigins array from the allowedOrigins module
const allowedOrigins = require("./allowedOrigins");

// Define the CORS options
const corsOptions = {
  // Define the origin property as a function to dynamically set the allowed origins
  origin: (origin, callback) => {
    // Check if the request's origin is in the allowedOrigins array or if there is no origin (for server-to-server requests like postman or other testing tools)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // If the origin is allowed, call the callback with null (no error) and true (allow the request)
      callback(null, true);
    } else {
      // If the origin is not allowed, call the callback with an error message
      callback(new Error("Not allowed by CORS"));
    }
  },
  // Allow credentials to be included in the request
  credentials: true,
  // Set the status code for successful OPTIONS requests to 200
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
