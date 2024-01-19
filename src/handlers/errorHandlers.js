/*
  Catch Errors Middleware

  This middleware is designed to catch errors thrown by asynchronous functions. Instead of
  scattering try{} catch(e) {} blocks in each controller, we use catchErrors() to wrap
  the function. Any errors thrown are then passed to our Express middleware using next().
*/
exports.catchErrors = (asyncFunction) => {
  return function (req, res, next) {
    const result = asyncFunction(req, res, next);
    if (result instanceof Promise) {
      return result.catch(next);
    }
    return result;
  };
};

/*
    Not Found Middleware
  
    If a route is not found, this middleware marks it as a 404 and passes it along to the
    next error handler for display.
  */
exports.notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

/*
    Development Error Middleware
  
    In a development environment, this middleware shows detailed error messages. This helps
    identify and address syntax errors or any other previously unhandled errors, providing
    useful information on what happened.
  */
exports.developmentErrors = (err, req, res, next) => {
  err.stack = err.stack || "";
  const errorDetails = {
    message: err.message,
    status: err.status,
    stackHighlighted: err.stack.replace(
      /[a-z_-\d]+.js:\d+:\d+/gi,
      "<mark>$&</mark>"
    ),
  };

  res.status(500).json({
    success: false,
    errorDetails,
    message: "Oops! There was an error on the server.",
  });
};

/*
    Production Error Middleware
  
    In a production environment, this middleware ensures that no stack traces are leaked to
    the client. It responds with a generic error message to avoid revealing sensitive
    information.
  */
exports.productionErrors = (err, req, res, next) => {
  const errorDetails = {
    message: err.message,
    status: err.status,
    stackHighlighted: err.stack.replace(
      /[a-z_-\d]+.js:\d+:\d+/gi,
      "<mark>$&</mark>"
    ),
  };

  console.debug("errorDetails", errorDetails);
  res.status(500).json({
    success: false,
    message: "Oops! There was an error on the server.",
  });
};
