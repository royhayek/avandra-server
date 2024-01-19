const express = require("express");
const { catchErrors } = require("../handlers/errorHandlers");

const router = express.Router();

const userController = require("../controllers/userController");
const dashboardController = require("../controllers/dashboardController");
const destinationController = require("../controllers/destinationController");

// *** User Routes *** //
router.route("/user/create").post(catchErrors(userController.create));
router.route("/user/read/:id").get(catchErrors(userController.read));
router.route("/user/update/:id").patch(catchErrors(userController.update));
router.route("/user/delete/:id").delete(catchErrors(userController.delete));
router.route("/user/search").get(catchErrors(userController.search));
router.route("/user/list").get(catchErrors(userController.list));
router
  .route("/user/password-update/:id")
  .patch(catchErrors(userController.updatePassword));

// *** Dashboard Routes *** //
router.route("/dashboard").get(catchErrors(dashboardController.read));

// *** Destination Routes *** //
router
  .route("/destination/create")
  .post(catchErrors(destinationController.createWithImage));
router
  .route("/destination/read/:id")
  .get(catchErrors(destinationController.read));
router
  .route("/destination/update/:id")
  .patch(catchErrors(destinationController.updateWithImage));
router
  .route("/destination/delete/:id")
  .delete(catchErrors(destinationController.delete));
router.route("/destination/list").get(catchErrors(destinationController.list));

module.exports = router;
