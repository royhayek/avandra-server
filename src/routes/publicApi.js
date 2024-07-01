const express = require("express");

const router = express.Router();

const { catchErrors } = require("../handlers/errorHandlers");

const tripController = require("../controllers/tripController");
const searchController = require("../controllers/searchController");
const articleController = require("../controllers/articleController");
const settingsController = require("../controllers/settingsController");
const destinationController = require("../controllers/destinationController");
const walkthroughController = require("../controllers/walkthroughController");
const { isValidToken, login, logout, register, validateToken, guest } = require("../controllers/authController");

router.route("/register").post(catchErrors(register));
router.route("/login").post(catchErrors(login));
router.route("/validateToken").get(catchErrors(validateToken));
router.route("/logout").post(isValidToken, catchErrors(logout));

router.route("/article/list").get(catchErrors(articleController.list));
router.route("/article/read/:id").get(catchErrors(articleController.read));

router.route("/trip/read/:id").get(catchErrors(tripController.getTripById));

router.route("/destination/list").get(catchErrors(destinationController.list));
router.route("/destination/read/:id").get(catchErrors(destinationController.read));

router.route("/search/recent").get(catchErrors(searchController.recent));

router.route("/walkthrough/list").get(catchErrors(walkthroughController.list));

router.route("/settings/config").get(catchErrors(settingsController.config));

module.exports = router;
