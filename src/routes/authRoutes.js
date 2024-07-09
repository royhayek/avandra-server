const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const loginLimiter = require("../middlewares/loginLimiter");

router.route("/login").post(loginLimiter, authController.login);
router.route("/register").post(authController.register);
router.route("/logout").post(authController.logout);
router.route("/refresh-token").get(authController.refreshToken);
router.route("/reset-password").post(authController.resetPassword);
router.route("/forgot-password").post(authController.forgotPassword);

module.exports = router;
