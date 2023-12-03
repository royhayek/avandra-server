const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  console.debug("req", req.headers);
  const authHeader = req.headers.authorization;
  console.debug("authHeader", authHeader);
  if (!authHeader) {
    res.status(401).json({
      status: "fail",
      message: "Unauthorized!",
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, "SECRET");
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      status: "fail",
      message: "Unauthorized!",
    });
  }
};
