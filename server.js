const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');  //Step 1
const passport = require("passport"); //use a "JwtStrategy" (passportJWT.Strategy) and initializing the 
                                        //passport middleware for use in our server. 
                                        //Step 1
const passportJWT = require("passport-jwt");//Step 1
const dotenv = require("dotenv");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;


// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// Configure its options
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
jwtOptions.secretOrKey = process.env.JWT_SECRET;

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        // The following will ensure that all routes using 
        // passport.authenticate have a req.user._id, req.user.userName
        // that matches the request payload data
        next(null, { 
            _id: jwt_payload._id, 
            userName: jwt_payload.userName}); 
    } else {
        next(null, false);
    }
});
// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());


app.use(express.json());
app.use(cors());

/* TODO Add Your Routes Here */
app.post("/api/register", (req, res) => {
    userService.registerUser(req.body)
        .then((msg) => {
            res.json({ "message": msg });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});

app.post("/api/login", (req, res) => {
    userService.checkUser(req.body)
        .then((user) => {
            let payload= {
                "_id" : user._id,
                "userName" : user.userName,
                "password" : user.password
            };

            var token = jwt.sign(payload, jwtOptions.secretOrKey);      //will generate a JWT for us using the user’s “_id”, “userName”, 
            res.json({ "message": "login successful", "token" : token });
        }).catch((msg) => {
            res.status(422).json({ "message": msg });
        });
});


app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getFavourites(req.user._id)
    .then((fav) =>{
        res.json(fav);
    })
    .catch((err)=>{
        res.json({ "message": err }); });
});


app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
    .then((fav) =>{
        res.json(fav);
    })
    .catch((err)=>{
        res.json({ "message": err });    })

});
app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
    .then((fav)=>{
        res.json(fav);
    })
    .catch((err)=>{
        res.json({ "message": err });
    })

})
userService.connect()
.then(() => {  
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});

app.post("/api/login", (req, res) => {
       if(req.body.user === "alex" && req.body.password === "alex123"){
        var token = jwt.sign(user: "alex", "test6"); 
    
       res.json({ "message": "success", "token" : token });
    }
    else{
                    res.status(422).json({ "message": unsuccessful });
    }

    });