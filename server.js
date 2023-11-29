require("dotenv").config();
const express = require("express");
const morgan = require("morgan"); //middleware to log HTTP requests and errors, and simplifies the process
const createError = require("http-errors");
const cors = require("cors");
const { verifyAccessToken } = require("./helpers/jwt_helper.js");
require("./helpers/init_mongodb.js");
require("./helpers/init_redis.js");

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

const HTTP_PORT = process.env.PORT || 3000;
app.listen(HTTP_PORT, () => {
  console.log("API listening on: " + HTTP_PORT);
});

const AuthRoute = require("./routes/auth.route.js");

//routes
app.get("/", async (req, res, next) => {
  //console.log(req.headers["authorization"]);
  res.json("Hello from express");
  // console.log("_id = ", req.payload.aud[0]);
});

app.use("/api/auth", AuthRoute);

//when a route that is not in the app is tried to be accessed, this middleware will be triggered
app.use(async (req, res, next) => {
  next(createError.NotFound());
});
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});
