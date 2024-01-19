const cors = require("cors");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const promisify = require("es6-promisify");
const MongoStore = require("connect-mongo");

const apiRouter = require("./src/routes/api");
const authApiRouter = require("./src/routes/authApi");

const errorHandlers = require("./src/handlers/errorHandlers");

const { isValidToken } = require("./src/controllers/authController");

require("dotenv").config({ path: ".env" });

const app = express();

// Serve static files from the 'public' director.
app.use(express.static(path.join(__dirname, "public")));

// Takes the raw requests and turns them into usable properties on req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
  })
);

// Sessions allow us to Contact data on visitors from request to request
// This keeps admins logged in and allows us to send flash messages
app.use(
  session({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE }),
  })
);

// pass variables to our templates + all requests
app.use((req, res, next) => {
  res.locals.admin = req.admin || null;
  res.locals.currentPath = req.path;
  next();
});

// promisify some callback based APIs
app.use((req, res, next) => {
  req.login = promisify(req.login, req);
  next();
});

// Here our API Routes
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,PATCH,PUT,POST,DELETE");
  res.header("Access-Control-Expose-Headers", "Content-Length");
  res.header(
    "Access-Control-Allow-Headers",
    "Accept, Authorization,x-auth-token, Content-Type, X-Requested-With, Range"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  } else {
    return next();
  }
});

app.use("/api", authApiRouter);

// for development & production don't use this line app.use("/api", apiRouter); , this is just demo login contoller
// app.use("/api", apiRouter);

//uncomment line below // app.use("/api", isValidToken, apiRouter);
app.use("/api", isValidToken, apiRouter);

// If above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (app.get("env") === "development") {
  /* Development Error Handler - Prints stack trace */
  app.use(errorHandlers.developmentErrors);
}

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (app.get("env") === "development") {
  /* Development Error Handler - Prints stack trace */
  app.use(errorHandlers.developmentErrors);
}

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
