global.TextEncoder = require("util").TextEncoder;
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
require("dotenv").config();
mongoose
  .connect(process.env.MONGODB_IP)
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console.log(err);
  });

const express = require("express");
const app = express();
const path = require("path");

//public join
app.use(express.static(path.join(__dirname, "public")));

//nocache
const nocache = require("nocache");
app.use(nocache());

//bodyparser midleware for converting and reading datas come through req
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//session
const session = require("express-session");
const config = require("./config/config");
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 1000,
    },
  })
);

//for user route
const userRoute = require("./routes/userRoutes");
app.use("/", userRoute);

//admin route
const adminRoute = require("./routes/adminRoutes");
app.use("/admin", adminRoute);

// set view engine
app.set("view engine", "ejs");
app.set("views", "views");

//404
app.use(function (req, res, next) {
  res.status(404);

  // respond with html page
  if (req.accepts("html")) {
    res.render("404", { url: req.url });
    return;
  }
});

//500
app.use(function (err, req, res, next) {
  res.status(500);

  // respond with HTML page for 500 errors
  if (req.accepts("html")) {
    res.render("500", { error: err });
    return;
  }
});

//create server
app.listen(3000, function () {
  console.log("Server is running... ");
});
