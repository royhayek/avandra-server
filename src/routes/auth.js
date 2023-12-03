const express = require("express");
const controllers = require("../controllers");
const middlewares = require("../middlewares");
const router = express.Router();

router.post("/signup", controllers.auth.signup);
router.post("/login", controllers.auth.login);
router.post("/logout", middlewares.verifyAccessToken, controllers.auth.logout);
router.post("/logoutAll", controllers.auth.logoutAll);
router.post(
  "/accessToken",
  middlewares.verifyAccessToken,
  controllers.auth.newAccessToken
);
router.post(
  "/refreshToken",
  middlewares.verifyAccessToken,
  controllers.auth.newRefreshToken
);

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect(CLIENT_URL);
});

module.exports = router;
