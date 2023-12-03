const { HttpError } = require("../error");
const { errorHandler } = require("../util");
const jwt = require("jsonwebtoken");

const verifyAccessToken = errorHandler(async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    throw new HttpError(401, "Unauthorized");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.userId = decodedToken.userId;
    next();
  } catch (e) {
    throw new HttpError(401, "Unauthorized");
  }
});

// const jwt = require("jsonwebtoken");

// const validateJWT = errorHandler(async (req, res, next) => {
//   const token = req.header("x-auth-token");
//   if (!token) {
//     res.status(401).json({ msg: "NO token. Auth Failed" });
//   }
//   try {
//     console.log(token);
//     const decoded = jwt.verify(token, "Secret key");
//     req.user = decoded.user;
//     next();
//   } catch (err) {
//     console.log(err);
//     res.status(401).json({ msg: "Token is not valid" });
//   }
// });

module.exports = {
  verifyAccessToken,
  //   validateJWT,
};
