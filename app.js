var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bcrypt = require("bcryptjs");
const fs = require("fs")
const localStorage = require("./localStorage.json");
const session = require("express-session"); //for authentication
// var session = require('cookie-session');
const cors = require('cors');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const JwtStrategy = require('passport-jwt').Strategy;
const { Strategy, ExtractJwt } = require('passport-jwt');

const User = require("./models/user");
require('dotenv').config()


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
let apiRouter = require('./routes/api.js');

var app = express();
app.use(cookieParser());


// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URL;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(passport.initialize());
// app.use(cors({ credentials: true, origin:"https://localhost:5173",exposedHeaders: ["set-cookie"],})) //change when live or testing

app.use(cors({ credentials: true, origin:"https://messaging-app-frontend-seven.vercel.app", exposedHeaders: ["set-cookie"] })) //change when live or testing

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: "cats", resave: false, saveUninitialized: true })); //authentication

app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api',apiRouter);

//jwt startegy
function  getjwt(req){
  console.log("this is token",req.cookies);
  const token = req.cookies.jwt_token
  return token;
  // return localStorage.Authorization?.substring(7); //removes "bearer " from token
}


passport.use(
  new JwtStrategy(
    {
      secretOrKey: "secret",
      jwtFromRequest: getjwt,
    },
    async(token,done) =>{
      // console.log(cookieParser)
        done(null,token.user);
    }
  )

)
app.get("/login", (req, res, next) => {

  res.send("login page");
  
});
//DOUBLE CHECK
app.post(
  "/login", async(req,res,next) =>{
  passport.authenticate("login",  async function(error,user,info){
    if(error){
      console.log("error")
      res.json(error);
    }
    if(!user){
      res.statusMessage = "User Not Found";
      res.status(400).end();
    }
    else{
      const body = {_id: user.id, username: user.username}; //creates a unique body to use for the webtoken

      const token = jwt.sign({user:body}, "secret",{expiresIn:'1d'}); 
      const updatedUser= await User.findByIdAndUpdate(user._id, {isactive:true}, {}).exec();
      
      // DELETE DONT NEED (COOKIES USED INSTEAD)
      // await fs.writeFile(
      //   "localStorage.json",
      //   JSON.stringify({Authorization: `Bearer ${token}`}),
      //   (err)=>{
      //     if(err){
      //     throw err;
      //     //  return next(err);
      //     }
      //   }
      // )
      // res.cookie("jwt",token).json({user,token});

      res.cookie("jwt_token", token, {
        path: "/",
        httpOnly: false,
        expires: new Date(Date.now() + 1000000),
        sameSite: "none",
        secure: true,
          }).json({user,token});
      // res.json({user,token});

      // res.json({user,token});
    }
    
  })(req,res,next);
});
app.post("/logout", async (req, res, next) => {

  req.logout((err) => {
    if (err) {
      return next(err);
    }
    //DONT NEED DELETE  
    // fs.writeFile(
    //   "localStorage.json",
    //   JSON.stringify({Authorization: ``}),
    //   (err)=>{
    //     if(err){
    //      throw err;
    //     }
    //   }
    // )
    // res.clearCookie("jwt_token");
    res.json("loggin out");
  });
  const updatedUser= await User.findByIdAndUpdate(req.body.userid, {isactive:false}, {}).exec();

});
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

passport.use(
  "login",
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      };
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
      // passwords do not match!
          return done(null, false, { message: "Incorrect password" })
      }
      return done(null, user);
    } catch(err) {
      return done(err);
    };
  })
);



passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err);
  };
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
