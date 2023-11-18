const createError = require("http-errors");
const userModel = require("../models/user.model.js");
const { authSchema } = require("../helpers/validation_schema.js");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper.js");
const client = require("../helpers/init_redis.js");

module.exports = {
  register: async (req, res, next) => {
    console.log(req.body);
    try {
      const { email, password, confirm_password } = req.body;

      //check if both password match
      if (password !== confirm_password)
        throw createError.Conflict(
          "Your passwords don't match.  Please try again."
        );

      //validate using JOI
      const result = await authSchema.validateAsync({ email, password });
      console.log(result);

      //check if user exists in database
      const userExists = await userModel.findOne({ email: result.email });
      if (userExists)
        throw createError.Conflict(
          result.email + " has already been registered"
        );

      //create and save new user
      const user = new userModel(result);
      const savedUser = await user.save();

      //create token (logic in helper folder)
      const accessToken = await signAccessToken(savedUser._id);
      const refreshToken = await signRefreshToken(savedUser._id);
      res.json({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true) error.status = 422; //unprocessable entity.  server can understand the content type of the entity but is unable to process it.
      next(error);
    }
  },
  login: async (req, res, next) => {
    console.log("login route");

    try {
      const result = await authSchema.validateAsync(req.body);
      const userExists = await userModel.findOne({ email: result.email });

      if (!userExists) throw createError.NotFound("User not registered");

      const isMatch = await userExists.isValidPassword(result.password);
      if (!isMatch)
        throw createError.Unauthorized("username/password not valid");

      const accessToken = await signAccessToken(userExists._id);
      const refreshToken = await signRefreshToken(userExists._id);

      res.json({ accessToken, refreshToken });
    } catch (error) {
      if (error.isJoi === true)
        return next(createError.BadRequest("Invalid Username or password"));
      next(error);
    }
  },
  refreshToken: async (req, res, next) => {
    console.log("refresh-token route");

    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);

      const accessToken = await signAccessToken(userId);
      const refresh_Token = await signRefreshToken(userId);

      res.json({ accessToken, refreshToken: refresh_Token });
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw createError.BadRequest();
      const userId = await verifyRefreshToken(refreshToken);

      client.DEL(userId, (err, result) => {
        if (err) {
          console.log(err.message);
          throw createError.InternalServerError();
        }
        console.log(result);
      });
      res.status(204).send("Logged out");
    } catch (error) {
      next(error);
    }
  },
  addFavouriteSong: async (req, res, next) => {
    // user id info in req.payload.

    try {
      const userId = req.payload.aud[0];
      const favId = req.params.id;
      userModel
        .findByIdAndUpdate(
          userId,
          { $addToSet: { favourites: favId } },
          { new: true }
        )
        .exec()
        .then((user) => {
          if (!user) {
            return next(createError.InternalServerError());
          }
          res.json(user.favourites);
        })
        .catch((err) => {
          return next(createError.InternalServerError());
        });
    } catch (error) {
      next(error);
    }
  },
  getAllFavourites: async (req, res, next) => {
    try {
      const userId = req.payload.aud[0];

      userModel
        .findById(userId)
        .exec()
        .then((user) => {
          if (!user) {
            return next(createError.InternalServerError());
          }
          res.json(user.favourites);
        })
        .catch((err) => {
          return next(createError.InternalServerError());
        });
    } catch (error) {
      next(error);
    }
  },
  removeFavourite: async (req, res, next) => {
    try {
      const userId = req.payload.aud[0];
      const favId = req.params.id;

      userModel
        .findByIdAndUpdate(userId, { $pull: { favourites: favId } })
        .exec()
        .then((user) => {
          console.log("user", user);
          if (!user) {
            return next(createError.InternalServerError());
          } else {
            res.json(user.favourites);
          }
        })
        .catch((err) => {
          return next(createError.InternalServerError());
        });
    } catch (error) {
      next(error);
    }
  },
};
