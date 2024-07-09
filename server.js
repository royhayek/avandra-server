require("dotenv").config();
require('express-async-errors')

const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/config/dbConn");
const { logger } = require("./src/middlewares/logger");
const corsOptions = require("./src/config/corsOptions");
const { logEvents } = require("./src/middlewares/logger");
const errorHandler = require("./src/middlewares/errorHandler");
const tripController = require("./src/controllers/tripController");

const app = express();

const PORT = process.env.PORT || 3500;

console.log(process.env.NODE_ENV);

connectDB();

app.use(logger);

app.use(cors(corsOptions));

app.use(bodyParser.json());

app.use(cookieParser());

// Serve static files from the 'public' director.
app.use(express.static(path.join(__dirname, "public")));
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));
app.get("/.well-known/apple-app-site-association", (req, res) => {
  res.sendFile(path.join(__dirname, ".well-known/apple-app-site-association"));
});

app.use("/", require("./src/routes/root"));
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api", require("./src/routes/publicRoutes"));
app.use("/api", require("./src/routes/privateRoutes"));

// If above routes didnt work, we 404 them and forward to error handler
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "./src", "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");

  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

  // Schedule the task to run every day at midnight
  setTimeout(() => {
    cron.schedule("0 0 * * *", tripController.updateTripStatus);
  }, 1000);
});

mongoose.connection.on("error", (err) => {
  console.log(`🚫 Error → : ${err.message}`);
  logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, "mongoErrLog.log");
});
