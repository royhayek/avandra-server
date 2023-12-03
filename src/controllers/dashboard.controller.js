const models = require("../models");
const { errorHandler, withTransaction } = require("../util");

const getDashboardData = errorHandler(async (req, res) => {
  try {
    const users = await models.User.find();
    return {
      usersCount: users.length,
    };
  } catch (error) {
    res.json(error);
  }
});

module.exports = {
  getDashboardData,
};
