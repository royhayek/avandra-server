const express = require("express");

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
const notificationController = require("../controllers/notificationController");

const verifyJWT = require("../middlewares/verifyJWT");
const checkTripLimit = require("../middlewares/tripLimiter");

router.use(verifyJWT);

// *** User Routes *** //
router.route("/user/create").post(userController.create);
router.route("/user/read/:id").get(userController.read);
router.route("/user/update/:id").patch(userController.update);
router.route("/user/delete/:id").delete(userController.delete);
router.route("/user/search").get(userController.search);
router.route("/user/list").get(userController.list);
router.route("/user/password-update/:id").patch(userController.updatePassword);
router.route("/user/device-info").post(userController.deviceInfo);
router.route("/user/update-subscription").patch(userController.updateSubscription);

// *** Configuration Routes *** //
router.route("/config").get(configController.read);
router.route("/images").post(configController.images);

// *** Dashboard Routes *** //
router.route("/dashboard").get(dashboardController.read);

// *** Destination Routes *** //
router.route("/destination/create").post(destinationController.createWithImage);
router.route("/destination/read/:id").get(destinationController.read);
router.route("/destination/update/:id").patch(destinationController.updateWithImage);
router.route("/destination/delete/:id").delete(destinationController.delete);

router.route("/search/increment").post(searchController.increment);

router.route("/walkthrough/create").post(walkthroughController.createWithImage);
router.route("/walkthrough/read/:id").get(walkthroughController.read);
router.route("/walkthrough/update/:id").patch(walkthroughController.updateWithImage);
router.route("/walkthrough/delete/:id").delete(walkthroughController.delete);
router.route("/walkthrough/list").get(walkthroughController.list);

router.route("/article/create").post(articleController.createWithImage);
router.route("/article/read/:id").get(articleController.read);
router.route("/article/update/:id").patch(articleController.updateWithImage);
router.route("/article/delete/:id").delete(articleController.delete);

router.route("/traveler/create").post(travelerController.createWithImage);
router.route("/traveler/read/:id").get(travelerController.read);
router.route("/traveler/update/:id").patch(travelerController.updateWithImage);
router.route("/traveler/delete/:id").delete(travelerController.delete);
router.route("/traveler/list").get(travelerController.list);

router.route("/budget/create").post(budgetController.createWithImage);
router.route("/budget/read/:id").get(budgetController.read);
router.route("/budget/update/:id").patch(budgetController.updateWithImage);
router.route("/budget/delete/:id").delete(budgetController.delete);
router.route("/budget/list").get(budgetController.list);

router.route("/interest/create").post(interestController.createWithImage);
router.route("/interest/read/:id").get(interestController.read);
router.route("/interest/update/:id").patch(interestController.updateWithImage);
router.route("/interest/delete/:id").delete(interestController.delete);
router.route("/interest/list").get(interestController.list);

router.route("/message/create").post(messageController.sendMessage);
router.route("/message/read/:id").get(messageController.read);
router.route("/message/update/:id").patch(messageController.update);
router.route("/message/delete/:id").delete(messageController.delete);
router.route("/message/list").get(messageController.list);

router.route("/faqcategory/create").post(faqCategoryController.create);
router.route("/faqcategory/read/:id").get(faqCategoryController.read);
router.route("/faqcategory/update/:id").patch(faqCategoryController.update);
router.route("/faqcategory/delete/:id").delete(faqCategoryController.delete);

router.route("/faq/create").post(faqController.create);
router.route("/faq/read/:id").get(faqController.read);
router.route("/faq/update/:id").patch(faqController.update);
router.route("/faq/delete/:id").delete(faqController.delete);

router.route("/trip/generate").post(checkTripLimit, tripController.generate);
router.route("/trip/create").post(tripController.createWithImage);
router.route("/trip/read/:id").get(tripController.getTripById);
router.route("/trip/update/:id").patch(tripController.updateWithImage);
router.route("/trip/delete/:id").delete(tripController.delete);
router.route("/trip/list").get(tripController.list);
router.route("/trip/list/user/:id").get(tripController.tripsByUser);
router.route("/trip/additional/:id").post(tripController.saveAdditional);
router.route("/trip/places/:id").get(tripController.readTripPlaces);
router.route("/trip/place/:id/:placeId/:date").delete(tripController.deletePlace);
router.route("/trip/places/:id").patch(tripController.updateTripPlaces);
router.route("/trip/places/popular/:id").get(tripController.getPopularPlaces);
router.route("/trip/editability/:tripId").patch(tripController.updateEditability);

router.route("/settings/create").post(settingsController.create);
router.route("/settings/read/:id").get(settingsController.read);
router.route("/settings/update/:id").patch(settingsController.update);
router.route("/settings/delete/:id").delete(settingsController.delete);
router.route("/settings/list").get(settingsController.list);
router.route("/settings/privacyPolicy").get(settingsController.privacyPolicy);

router.route("/language/create").post(languageController.create);
router.route("/language/read/:id").get(languageController.read);
router.route("/language/update/:id").patch(languageController.update);
router.route("/language/delete/:id").delete(languageController.delete);
router.route("/language/list").get(languageController.list);

router.route("/notification/create").post(notificationController.create);
router.route("/notification/read/:id").get(notificationController.read);
router.route("/notification/update/:id").patch(notificationController.update);
router.route("/notification/delete/:id").delete(notificationController.delete);
router.route("/notification/list").get(notificationController.list);
router.route("/notification/send").post(notificationController.sendNotification);

module.exports = router;
