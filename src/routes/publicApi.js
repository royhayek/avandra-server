const express = require("express");

const router = express.Router();

const { catchErrors } = require("../handlers/errorHandlers");

const tripController = require("../controllers/tripController");
const articleController = require("../controllers/articleController");
const settingsController = require("../controllers/settingsController");
const destinationController = require("../controllers/destinationController");
const walkthroughController = require("../controllers/walkthroughController");
const { isValidToken, login, logout, register, validateToken } = require("../controllers/authController");

router.route("/register").post(catchErrors(register));
router.route("/login").post(catchErrors(login));
router.route("/validateToken").get(catchErrors(validateToken));
router.route("/logout").post(isValidToken, catchErrors(logout));

router.route("/article/read/:id").get(catchErrors(articleController.read));

router.route("/trip/read/:id").get(catchErrors(tripController.getTripById));

router.route("/destination/read/:id").get(catchErrors(destinationController.read));

router.route("/walkthrough/list").get(catchErrors(walkthroughController.list));

router.route("/settings/config").get(catchErrors(settingsController.config));

module.exports = router;
