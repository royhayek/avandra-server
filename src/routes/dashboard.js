const express = require("express");
const controllers = require("../controllers");
const middlewares = require("../middlewares");
const { User } = require("../models");
const router = express.Router();

router.get(
  "/",
  middlewares.verifyAccessToken,
  controllers.dashboard.getDashboardData
);

module.exports = router;
