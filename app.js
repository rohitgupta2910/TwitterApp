const dotenv = require("dotenv");
dotenv.config();
//or you can write require('dotenv').config()
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//connecting database
const connectToDB = require("./config/db.config");
connectToDB();

//creating db models
const userModel = require("./model/user.model");
const tweetModel = require("./model/tweet.model");
const commentModel = require("./model/comment.model");

const authMiddleware = require("./middleware/authMiddleware");

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.render("welcome");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await userModel.create({
    username,
    password: hashedPassword,
  });
  const token = jwt.sign(
    {
      username: newUser.username,
      id: newUser._id,
    },
    process.env.JWT_SECRET
  );
  res.cookie("token", token);
  res.redirect("/profile");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await userModel.findOne({ username }); //yaha pe as object hee pass krte
  if (!user) {
    res.redirect("/login");
  }
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.redirect("/login");
  }

  const token = jwt.sign(
    {
      username: user.username,
      id: user._id,
    },
    process.env.JWT_SECRET
  );
  res.cookie("token", token);
  res.redirect("/profile");
});

app.get("/newtweet", authMiddleware.authUser, async (req, res, next) => {
  res.render("newTweet");
});

app.post("/newtweet", authMiddleware.authUser, async (req, res, next) => {
  const newTweet = await tweetModel.create({
    text: req.body.tweet,
    username: req.user.username
  });

  const loggedInUser = await userModel.findById(req.user._id);
  loggedInUser.tweets.push(newTweet._id);
  await loggedInUser.save();

  res.redirect("/profile");
});

app.get("/profile", authMiddleware.authUser, async (req, res, next) => {
  const loggedInUser = await userModel
    .findById(req.user._id)
    .populate("tweets");

  res.render("profile", { user: loggedInUser });
});

app.get("/feed", authMiddleware.authUser, async (req, res, next) => {
  const tweets = await tweetModel.find().populate("comments");
  res.render("feed", { tweets });
});
// app.get("/profile", authMiddleware.authUser, async (req, res) => {
// //   const user = req.user;
// //   const loggedInUser = await userModel.findOne(
// //   {_id:user._id}).populate('tweets') //tweets bcoz jis field mein tweet aarha tha that is jis array mein arha hai
// //   const tweets = await tweetModel.find({ username: user.username }); //joh user login hai sirf uske tweets leke aao
// //   //ab profile load hone pe uska data show krna hai apne ko , so we will use middleware
// //   res.render("profile", { user: req.user, tweets });
// // });

// // app.get("/newTweet", authMiddleware.authUser, (req, res) => {
// //   res.render("newTweet");
// // });

// // app.post("/newTweet", authMiddleware.authUser, async (req, res) => {
// //   const newTweet = await tweetModel.create({
// //     text: req.body.tweet,
// //     username: req.user.username, //since we used authMiddleware.authUser so we have req.user here so we can use that
// //   });

// //   const loggedInUser = await userModel.findById(req.user._id);
// //   loggedInUser.tweets.push(newTweet._id);
// //   await loggedInUser.save();

// //   //   await userModel.findByIdAndUpdate(req.user._id, { //id se user laao aur push krdo tweet array mein id ko
// //   //     $push: {
// //   //       tweets: newTweet._id,
// //   //      })
//   res.redirect("/profile");
// });

app.get("/like-tweet/:id", authMiddleware.authUser, async (req, res, next) => {
  const tweet = await tweetModel.findById(req.params.id);

  if (tweet.likes.includes(req.user._id)) {
    tweet.likes.splice(tweet.likes.indexOf(req.user._id), 1);
  } else {
    tweet.likes.push(req.user._id);
  }

  await tweet.save();

  res.redirect("/feed");
});

app.post("/comment/:id", authMiddleware.authUser, async (req, res, next) => {
  const newComment = await commentModel.create({
    user: req.user._id,
    data: req.body.comment,
    tweet: req.params.id,
  });

  const tweet = await tweetModel.findOne({ _id: req.params.id });
  tweet.comments.push(newComment._id);

  await tweet.save();

  res.redirect("/feed");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/");
});

app.listen(3000);
