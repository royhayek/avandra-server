const path = require("path");
const express = require("express");

const router = express.Router();

const faqController = require("../controllers/faqController");
const tripController = require("../controllers/tripController");
const searchController = require("../controllers/searchController");
const articleController = require("../controllers/articleController");
const settingsController = require("../controllers/settingsController");
const destinationController = require("../controllers/destinationController");
const walkthroughController = require("../controllers/walkthroughController");
const faqCategoryController = require("../controllers/faqCategoryController");

router.route("/article/list").get(articleController.list);
router.route("/article/read/:id").get(articleController.read);

router.route("/trip/read/:id").get(tripController.getTripById);

router.route("/destination/list").get(destinationController.list);
router.route("/destination/read/:id").get(destinationController.read);

router.route("/search/recent").get(searchController.recent);

router.route("/walkthrough/list").get(walkthroughController.list);

router.route("/settings/config").get(settingsController.config);

router.route("/faqcategory/list").get(faqCategoryController.list);

router.route("/faq/list/:id").get(faqController.list);

module.exports = router;
