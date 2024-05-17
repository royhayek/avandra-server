module.exports = function (io) {
  const express = require("express");
  const { catchErrors } = require("../handlers/errorHandlers");

  const router = express.Router();

  const faqController = require("../controllers/faqController");
  const tripController = require("../controllers/tripController");
  const userController = require("../controllers/userController");
  const searchController = require("../controllers/searchController");
  const configController = require("../controllers/configController");
  const budgetController = require("../controllers/budgetController");
  const articleController = require("../controllers/articleController");
  const messageController = require("../controllers/messageController");
  const languageController = require("../controllers/languageController");
  const travelerController = require("../controllers/travelerController");
  const interestController = require("../controllers/interestController");
  const settingsController = require("../controllers/settingsController");
  const dashboardController = require("../controllers/dashboardController");
  const faqCategoryController = require("../controllers/faqCategoryController");
  const destinationController = require("../controllers/destinationController");
  const walkthroughController = require("../controllers/walkthroughController");

  // *** User Routes *** //
  router.route("/user/create").post(catchErrors(userController.create));
  router.route("/user/read/:id").get(catchErrors(userController.read));
  router.route("/user/update/:id").patch(catchErrors(userController.update));
  router.route("/user/delete/:id").delete(catchErrors(userController.delete));
  router.route("/user/search").get(catchErrors(userController.search));
  router.route("/user/list").get(catchErrors(userController.list));
  router.route("/user/password-update/:id").patch(catchErrors(userController.updatePassword));

  // *** Configuration Routes *** //
  router.route("/config").get(catchErrors(configController.read));

  // *** Dashboard Routes *** //
  router.route("/dashboard").get(catchErrors(dashboardController.read));

  // *** Destination Routes *** //
  router.route("/destination/create").post(catchErrors(destinationController.createWithImage));
  router.route("/destination/read/:id").get(catchErrors(destinationController.read));
  router.route("/destination/update/:id").patch(catchErrors(destinationController.updateWithImage));
  router.route("/destination/delete/:id").delete(catchErrors(destinationController.delete));
  router.route("/destination/list").get(catchErrors(destinationController.list));

  router.route("/search/increment").post(catchErrors(searchController.increment));
  router.route("/search/recent").get(catchErrors(searchController.recent));

  router.route("/walkthrough/create").post(catchErrors(walkthroughController.createWithImage));
  router.route("/walkthrough/read/:id").get(catchErrors(walkthroughController.read));
  router.route("/walkthrough/update/:id").patch(catchErrors(walkthroughController.updateWithImage));
  router.route("/walkthrough/delete/:id").delete(catchErrors(walkthroughController.delete));
  router.route("/walkthrough/list").get(catchErrors(walkthroughController.list));

  router.route("/article/create").post(catchErrors(articleController.createWithImage));
  router.route("/article/read/:id").get(catchErrors(articleController.read));
  router.route("/article/update/:id").patch(catchErrors(articleController.updateWithImage));
  router.route("/article/delete/:id").delete(catchErrors(articleController.delete));
  router.route("/article/list").get(catchErrors(articleController.list));

  router.route("/traveler/create").post(catchErrors(travelerController.createWithImage));
  router.route("/traveler/read/:id").get(catchErrors(travelerController.read));
  router.route("/traveler/update/:id").patch(catchErrors(travelerController.updateWithImage));
  router.route("/traveler/delete/:id").delete(catchErrors(travelerController.delete));
  router.route("/traveler/list").get(catchErrors(travelerController.list));

  router.route("/budget/create").post(catchErrors(budgetController.createWithImage));
  router.route("/budget/read/:id").get(catchErrors(budgetController.read));
  router.route("/budget/update/:id").patch(catchErrors(budgetController.updateWithImage));
  router.route("/budget/delete/:id").delete(catchErrors(budgetController.delete));
  router.route("/budget/list").get(catchErrors(budgetController.list));

  router.route("/interest/create").post(catchErrors(interestController.createWithImage));
  router.route("/interest/read/:id").get(catchErrors(interestController.read));
  router.route("/interest/update/:id").patch(catchErrors(interestController.updateWithImage));
  router.route("/interest/delete/:id").delete(catchErrors(interestController.delete));
  router.route("/interest/list").get(catchErrors(interestController.list));

  router.route("/message/create").post(catchErrors(messageController.create));
  router.route("/message/read/:id").get(catchErrors(messageController.read));
  router.route("/message/update/:id").patch(catchErrors(messageController.update));
  router.route("/message/delete/:id").delete(catchErrors(messageController.delete));
  router.route("/message/list").get(catchErrors(messageController.list));

  router.route("/faqcategory/create").post(catchErrors(faqCategoryController.create));
  router.route("/faqcategory/read/:id").get(catchErrors(faqCategoryController.read));
  router.route("/faqcategory/update/:id").patch(catchErrors(faqCategoryController.update));
  router.route("/faqcategory/delete/:id").delete(catchErrors(faqCategoryController.delete));
  router.route("/faqcategory/list").get(catchErrors(faqCategoryController.list));

  router.route("/faq/create").post(catchErrors(faqController.create));
  router.route("/faq/read/:id").get(catchErrors(faqController.read));
  router.route("/faq/update/:id").patch(catchErrors(faqController.update));
  router.route("/faq/delete/:id").delete(catchErrors(faqController.delete));
  router.route("/faq/list/:id").get(catchErrors(faqController.list));

  router.route("/trip/socketTest").post(catchErrors(tripController.socketTest(io)));
  router.route("/trip/generate").post(catchErrors(tripController.generate(io)));
  router.route("/trip/create").post(catchErrors(tripController.createWithImage));
  router.route("/trip/read/:id").get(catchErrors(tripController.getTripById));
  router.route("/trip/update/:id").patch(catchErrors(tripController.updateWithImage));
  router.route("/trip/delete/:id").delete(catchErrors(tripController.delete));
  router.route("/trip/list").get(catchErrors(tripController.list));
  router.route("/trip/list/user/:id").get(catchErrors(tripController.tripsByUser));
  router.route("/trip/additional/:id").post(catchErrors(tripController.saveAdditional));
  router.route("/trip/places/:id").get(catchErrors(tripController.readTripPlaces));
  router.route("/trip/place/:id/:placeId/:date").delete(catchErrors(tripController.deletePlace));
  router.route("/trip/places/:id").patch(catchErrors(tripController.updateTripPlaces));
  router.route("/trip/places/popular/:id").get(catchErrors(tripController.getPopularPlaces));

  router.route("/settings/create").post(catchErrors(settingsController.create));
  router.route("/settings/read/:id").get(catchErrors(settingsController.read));
  router.route("/settings/update/:id").patch(catchErrors(settingsController.update));
  router.route("/settings/delete/:id").delete(catchErrors(settingsController.delete));
  router.route("/settings/list").get(catchErrors(settingsController.list));
  router.route("/settings/privacyPolicy").get(catchErrors(settingsController.privacyPolicy));

  router.route("/language/create").post(catchErrors(languageController.create));
  router.route("/language/read/:id").get(catchErrors(languageController.read));
  router.route("/language/update/:id").patch(catchErrors(languageController.update));
  router.route("/language/delete/:id").delete(catchErrors(languageController.delete));
  router.route("/language/list").get(catchErrors(languageController.list));

  return router;
};
