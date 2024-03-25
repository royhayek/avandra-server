const express = require("express");

const router = express.Router();

const { catchErrors } = require("../handlers/errorHandlers");

const walkthroughController = require("../controllers/walkthroughController");
const {
  isValidToken,
  login,
  logout,
  register,
} = require("../controllers/authController");

router.route("/register").post(catchErrors(register));
router.route("/login").post(catchErrors(login));
router.route("/validateToken").get(catchErrors(isValidToken));
router.route("/logout").post(isValidToken, catchErrors(logout));

router.route("/walkthrough/list").get(catchErrors(walkthroughController.list));

module.exports = router;
