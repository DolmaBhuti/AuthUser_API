//const userService = require("../user-service.js"); //auth controllers
const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const { verifyAccessToken } = require("../helpers/jwt_helper");

//register
router.post("/register", AuthController.register);

//login
router.post("/login", AuthController.login);

//logout
router.delete("/logout", AuthController.logout);

//refresh-token
router.post("/refresh-token", AuthController.refreshToken);

//add favourite song
router.put(
  "/favourites/:id",
  verifyAccessToken,
  AuthController.addFavouriteSong
);

//get all songs
router.get("/favourites", verifyAccessToken, AuthController.getAllFavourites);

//remove a song from favourites
router.delete(
  "/favourites/:id",
  verifyAccessToken,
  AuthController.removeFavourite
);

module.exports = router;
