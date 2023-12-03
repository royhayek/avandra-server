const jwt = require("jsonwebtoken");
const models = require("../models");
const argon2 = require("argon2");
const { errorHandler, withTransaction } = require("../util");
const { HttpError } = require("../error");

const signup = errorHandler(
  withTransaction(async (req, res, session) => {
    const userDoc = models.User({
      name: req.body.name,
      email: req.body.email,
      provider: req.body.provider,
      password: req.body.password,
      role: req.body.role,
    });

    // Validate required fields using the model's schema
    await userDoc.validate();

    // Encrypt password before saving userDoc
    userDoc.password = await argon2.hash(req.body.password);

    const refreshTokenDoc = models.RefreshToken({
      owner: userDoc.id,
    });

    await userDoc.save({ session });
    await refreshTokenDoc.save({ session });

    const refreshToken = createRefreshToken(userDoc.id, refreshTokenDoc.id);
    const accessToken = createAccessToken(userDoc.id);

    return {
      id: userDoc.id,
      accessToken,
      refreshToken,
    };
  })
);

const login = errorHandler(
  withTransaction(async (req, res, session) => {
    const user = await models.User.findOne({ email: req.body.email })
      .select("+password")
      .exec();
    if (!user) {
      throw new HttpError(401, "Wrong email or password");
    }

    if (!user.status) {
      throw new HttpError(403, "You account is disabled");
    }

    if (user.role === "user") {
      throw new HttpError(401, "You don't have access to this dashboard");
    }

    await verifyPassword(user.password, req.body.password);
    user.password = undefined;

    const refreshTokenDoc = models.RefreshToken({
      owner: user.id,
    });

    await refreshTokenDoc.save({ session });

    const refreshToken = createRefreshToken(user.id, refreshTokenDoc.id);
    const accessToken = createAccessToken(user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  })
);

const newRefreshToken = errorHandler(
  withTransaction(async (req, res, session) => {
    const currentRefreshToken = await validateRefreshToken(
      req.body.refreshToken
    );
    const refreshTokenDoc = models.RefreshToken({
      owner: currentRefreshToken.userId,
    });

    await refreshTokenDoc.save({ session });
    await models.RefreshToken.deleteOne(
      { _id: currentRefreshToken.tokenId },
      { session }
    );

    const refreshToken = createRefreshToken(
      currentRefreshToken.userId,
      refreshTokenDoc.id
    );
    const accessToken = createAccessToken(currentRefreshToken.userId);

    return {
      id: currentRefreshToken.userId,
      accessToken,
      refreshToken,
    };
  })
);

const newAccessToken = errorHandler(async (req, res) => {
  const refreshToken = await validateRefreshToken(req.body.refreshToken);
  const accessToken = createAccessToken(refreshToken.userId);

  return {
    id: refreshToken.userId,
    accessToken,
    refreshToken: req.body.refreshToken,
  };
});

const logout = errorHandler(
  withTransaction(async (req, res, session) => {
    const refreshToken = await validateRefreshToken(req.body.refreshToken);
    await models.RefreshToken.deleteOne(
      { _id: refreshToken.tokenId },
      { session }
    );
    return { success: true };
  })
);

const logoutAll = errorHandler(
  withTransaction(async (req, res, session) => {
    const refreshToken = await validateRefreshToken(req.body.refreshToken);
    await models.RefreshToken.deleteMany(
      { owner: refreshToken.userId },
      { session }
    );
    return { success: true };
  })
);

function createAccessToken(userId) {
  return jwt.sign(
    {
      userId: userId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "30m",
    }
  );
}

function createRefreshToken(userId, refreshTokenId) {
  return jwt.sign(
    {
      userId: userId,
      tokenId: refreshTokenId,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "30d",
    }
  );
}

const verifyPassword = async (hashedPassword, rawPassword) => {
  if (await argon2.verify(hashedPassword, rawPassword)) {
    // password matches
  } else {
    throw new HttpError(401, "Wrong email or password");
  }
};

const validateRefreshToken = async (token) => {
  const decodeToken = () => {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      // err
      throw new HttpError(401, "Unauthorised");
    }
  };

  const decodedToken = decodeToken();
  const tokenExists = await models.RefreshToken.exists({
    _id: decodedToken.tokenId,
    owner: decodedToken.userId,
  });
  if (tokenExists) {
    return decodedToken;
  } else {
    throw new HttpError(401, "Unauthorised");
  }
};

module.exports = {
  signup,
  login,
  newRefreshToken,
  newAccessToken,
  logout,
  logoutAll,
};
