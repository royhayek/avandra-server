const express = require("express");
const controllers = require("../controllers");
const middlewares = require("../middlewares");
const { User } = require("../models");
const router = express.Router();

router.get("/", middlewares.verifyAccessToken, controllers.users.getAllUsers);

router.get("/me", middlewares.verifyAccessToken, controllers.users.me);

router.post("/update", middlewares.verifyAccessToken, controllers.users.update);

router.post(
  "/delete",
  middlewares.verifyAccessToken,
  controllers.users.deleteUser
);

module.exports = router;
