const express = require("express");

const router = express.Router();

const { catchErrors } = require("../handlers/errorHandlers");

const tripController = require("../controllers/tripController");
const settingsController = require("../controllers/settingsController");
const walkthroughController = require("../controllers/walkthroughController");
const { isValidToken, login, logout, register, validateToken } = require("../controllers/authController");

router.route("/register").post(catchErrors(register));
router.route("/login").post(catchErrors(login));
router.route("/validateToken").get(catchErrors(validateToken));
router.route("/logout").post(isValidToken, catchErrors(logout));

router.route("/trip/read/:id").get(catchErrors(tripController.getTripById));

router.route("/walkthrough/list").get(catchErrors(walkthroughController.list));

router.route("/settings/config").get(catchErrors(settingsController.config));

module.exports = router;
