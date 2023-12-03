const express = require("express");
const logger = require("./logger");
const routes = require("./routes");
const cors = require("cors");
const connectToDatabase = require("./database");
const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

app.use("/api", routes);

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.statusCode || 500).send({ error: err.message });
});

async function startServer() {
  await connectToDatabase();

  app.listen(port, () => {
    logger.info(`Server listening at http://localhost:${port}`);
  });
}

module.exports = startServer;
