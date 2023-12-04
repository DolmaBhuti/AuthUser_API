"use script";

const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis.js");
module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "10h",
        issuer: "https://auth-user-api.fly.dev",
        audience: [userId],
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
          return;
        }
        resolve(token);
      });
    });
  },
  verifyAccessToken: (req, res, next) => {
    if (!req.headers["authorization"]) return next(createError.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },
  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET;
      const options = {
        expiresIn: "1y",
        issuer: "pickurpage.com",
        audience: [userId],
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
          return;
        }

        client.SET(userId.toString(), token, (err, reply) => {
          if (err) {
            console.log(err.message);
            reject(createError.InternalServerError());
            return;
          }
        });

        //token will expire in 1 year
        client.expire(userId.toString(), 31536000);

        resolve(token);
      });
    });
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized());

          const userId = payload.aud;
          client.GET(userId.toString(), (err, result) => {
            if (err) {
              console.log(err.message);
              reject(createError.InternalServerError()); //this error means that there is an internal error within your server/redis

              return;
            }
            if (refreshToken === result) {
              return resolve(userId.toString());
            }
            //token coming from redis and the token from the function does not match
            reject(createError.Unauthorized());
          });
          resolve(userId);
        }
      );
    });
  },
};
