const User = require("../models/userModel");
const Product = require("../models/poductsModel");
const Category = require("../models/categoryModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require("../config/config");
const Banner = require("../models/bannerModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");
const randomString = require("randomstring");
const validator = require("validator");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_AUTH_SID;
const client = require("twilio")(accountSid, authToken);

//load home page with checking user in session or not
const loadHome = async (req, res, next) => {
  try {
    let cartCount;
    let wishCount;
    let cartData;
    let wishlist;
    const productData = await Product.find({
      active: true,
    }).populate("category");
    const categories = await Category.find({ active: true });
    const banner = await Banner.find({ __v: 0 });

    if (req.session.userId) {
      const userData = await User.findById({ _id: req.session.userId });
      cartData = await Cart.findOne({ userId: userData._id });
      wishlist = await Wishlist.findOne({ userId: userData._id });

      if (cartData && wishlist) {
        cartCount = cartData.products.length;
        wishCount = wishlist.products.length;
        wishlist = wishlist.products;
        res.render("home", {
          userData,
          product: productData,
          categories,
          banner,
          cartCount,
          wishCount,
          wishlist,
        });
      } else if (cartData === null && wishlist) {
        wishCount = wishlist.products.length;
        wishlist = wishlist.products;
        res.render("home", {
          userData,
          product: productData,
          categories,
          banner,
          cartCount,
          wishCount,
          wishlist,
        });
      } else if (wishlist === null && cartData) {
        cartCount = cartData.products.length;
        wishlist = [0];
        res.render("home", {
          userData,
          product: productData,
          categories,
          banner,
          cartCount,
          wishCount,
          wishlist,
        });
      } else {
        let userData;
        wishlist = [0];
        res.render("home", {
          userData,
          product: productData,
          categories,
          banner,
          cartCount,
          wishCount,
          wishlist,
        });
      }
    } else {
      let userData;

      res.render("home", {
        userData,
        product: productData,
        categories: categories,
        banner: banner,
        cartCount,
        wishCount,
      });
    }
  } catch (error) {
    next(error);
  }
};

const contact = async (req, res, next) => {
  try {
    let cartData;
    let wishlist;
    let cartCount;
    let wishCount;
    if (req.session.userId) {
      const userData = await User.findById({ _id: req.session.userId });
      cartData = await Cart.findOne({ userId: userData._id });
      wishlist = await Wishlist.findOne({ userId: userData._id });
      if (cartData && wishlist) {
        cartCount = cartData.products.length;
        wishCount = wishlist.products.length;
        res.render("contact", { userData, cartCount, wishCount });
      } else if (cartData === null && wishlist) {
        wishCount = wishlist.products.length;
        res.render("contact", { userData, cartCount, wishCount });
      } else if (wishlist === null && cartData) {
        cartCount = cartData.products.length;
        res.render("contact", { userData, cartCount, wishCount });
      } else {
        res.render("contact", { userData, cartCount, wishCount });
      }
    } else {
      let userData;
      res.render("contact", { userData });
    }
  } catch (error) {
    next(error);
  }
};

//load signin page with checking user in session or not
const loadSignin = async (req, res, next) => {
  try {
    res.render("signin");
  } catch (error) {
    next(error);
  }
};

//load signup page with checking user in session or not
const loadSignup = async (req, res, next) => {
  try {
    res.render("signup");
  } catch (error) {
    next(error);
  }
};

// converting to bcryt data
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    next(error);
  }
};

//Sending a new otp to verify user number at signup page
const insertUser = async (req, res, next) => {
  try {
    const mobile = validator.escape(req.body.mobile);
    const email = validator.escape(req.body.email);

    let existMobile = await User.find({ mobile: mobile });
    let existEmail = await User.find({ email: email });

    if (!existMobile.length && !existEmail.length) {
      req.session.userData = req.body;

      if (req.session.userData) {
        if (req.session.userData.mobile) {
          const Number = req.session.userData.mobile;
          client.verify.v2
            .services(serviceSid)
            .verifications.create({ to: "+91" + Number, channel: "sms" })
            .then((verification) => console.log(verification.status));

          // res.redirect("/otpVerify");
          res.json({ success: true });
        } else {
          res.json({ message: "Number is not valid" });
        }
      } else {
        res.json({ message: "Your registration has been failed." });
      }
    } else {
      res.json({ message: "Account already Exist" });
    }
  } catch (error) {
    next(error);
  }
};

//checking user data with database details and verifying user already signed or not-login form
const verifyLogin = async (req, res, next) => {
  try {
    const mobile = req.body.mobile;
    const password = req.body.psw;

    const userData = await User.findOne({ mobile: mobile });
    if (userData) {
      if (userData.is_verified == 1) {
        //comparing database bycrpt with user typed password
        const passwordCheck = await bcrypt.compare(password, userData.password);
        if (passwordCheck) {
          req.session.userId = userData._id;
          res.json({ success: true });
        } else {
          res.json({ message: "Password is incorrect" });
        }
      } else {
        res.json({ message: "you are blocked by admin" });
      }
    } else {
      res.json({ message: "Create a new Account to signin" });
    }
  } catch (error) {
    next(error);
  }
};

//loading page to enter mobile number for signin with OTP
const loadMobileOTP = async (req, res, next) => {
  try {
    res.render("mobileotp");
  } catch (error) {
    next(error);
  }
};

//sending OTP for user for login with OTP
const sendOTP = async (req, res, next) => {
  try {
    req.session.userData = req.body;
    let Number = req.session.userData.mobile;
    let mobileData = await User.findOne({ mobile: Number });

    if (mobileData) {
      if (mobileData.is_verified === 1) {
        client.verify.v2
          .services(serviceSid)
          .verifications.create({ to: "+91" + Number, channel: "sms" })
          .then((verification) => console.log(verification.status));

        res.redirect("/otpVerify");
      } else {
        res.render("mobileotp", { message: "You are blocked by admin" });
      }
    } else {
      res.render("mobileotp", { message: "Please create an account fisrt" });
    }
  } catch (error) {
    next(error);
  }
};

const otpLoad = async (req, res, next) => {
  try {
    if (req.session.userData) {
      res.render("otpVerify");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    next(error);
  }
};

//verifying OTP using twilio in built method
const verifyOTP = async (req, res, next) => {
  try {
    const Number = req.session.userData.mobile;
    const otp = `${req.body.otp1}${req.body.otp2}${req.body.otp3}${req.body.otp4}`;
    client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: "+91" + Number, code: otp })
      .then((verification_check) => {
        if (verification_check.status === "approved") {
          if (req.session.userData.name) {
            //when signup occur
            (async function insertUser() {
              const psw = await securePassword(req.session.userData.psw);
              const user = new User({
                name: req.session.userData.name,
                email: req.session.userData.email,
                mobile: req.session.userData.mobile,
                password: psw,
                Date: Date().slice(0, 24),
                is_verified: 1,
              });
              const userData = await user.save();
              req.session.userId = userData._id;
              res.json({ success: true });
            })();
          } else {
            //when sigin with OTP occur
            (async function findUser() {
              const userData = await User.findOne({
                mobile: req.session.userData.mobile,
              });
              req.session.userId = userData._id;
              res.json({ success: true });
            })();
          }
        } else {
          res.json({ message: "OTP is incorrect " });
        }
      });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const number = req.session.userData.mobile;

    function sendTextMessage() {
      client.verify.v2
        .services(serviceSid)
        .verifications.create({ to: "+91" + number, channel: "sms" })
        .then((verification) => console.log(verification.status));
    }

    sendTextMessage();
    res.redirect("/otpVerify");
  } catch (error) {
    next(error);
  }
};

//for sent mail for reset password using smtp server passing argument from resetPass function
const sendResetPass = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.projEmail,
        pass: config.projPsw,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "For reset your password",
      //link with creating a token
      html:
        "<p>Hi " +
        name +
        ',please click here to <a href="http://127.0.0.1:3000/reset_password?token=' +
        token +
        '"> Reset </a> your password</p>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent :", info.response);
      }
    });
  } catch (error) {
    next(error);
  }
};

//getting posted data and check with database and generate token and send message to email
const resetPass = async (req, res, next) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_verified === 0) {
        res.render("signin", { message: "Please verify your mail" });
      } else {
        const randomstring1 = randomString.generate();
        const updateData = await User.updateOne(
          { email: email },
          { $set: { token: randomstring1 } }
        );
        sendResetPass(userData.name, userData.email, randomstring1);
        res.render("signin", {
          message: "Please check your email to reset your password",
        });
      }
    } else {
      res.render("signin", {
        message: "Email is not exist - Enter valid email",
      });
    }
  } catch (error) {
    next(error);
  }
};

//gettting token from email and check and render a page to enter a new password
const newPass = async (req, res, next) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("reset", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Page not found" });
    }
  } catch (error) {
    next(error);
  }
};

//setting a new Password for that user
const resetAndSet = async (req, res, next) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const securePass = await securePassword(password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: securePass, token: "" } }
    );
    res.redirect("/signin");
  } catch (error) {
    next(error);
  }
};

// logout with clear session
const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/signin");
  } catch (error) {
    next(error);
  }
};

const userProfile = async (req, res, next) => {
  try {
    let cartData;
    let wishlist;
    const userData = await User.findById({ _id: req.session.userId });
    cartData = await Cart.findOne({ userId: userData._id });
    wishlist = await Wishlist.findOne({ userId: userData._id });
    if (cartData && wishlist) {
      cartCount = cartData.products.length;
      wishCount = wishlist.products.length;
      res.render("userprofile", { userData, cartCount, wishCount });
    } else if (cartData === null && wishlist) {
      wishCount = wishlist.products.length;
      res.render("userprofile", { userData, cartCount, wishCount });
    } else if (wishlist === null && cartData) {
      cartCount = cartData.products.length;
      res.render("userprofile", { userData, cartCount, wishCount });
    } else {
      res.render("userprofile", { userData, cartCount, wishCount });
    }
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    let userData;
    let cartData;
    let wishlist;
    let cartCount;
    let wishCount;
    userData = await User.findById({ _id: req.session.userId });
    cartData = await Cart.findOne({ userId: userData._id });
    wishlist = await Wishlist.findOne({ userId: userData._id });

    if (cartData && wishlist) {
      cartCount = cartData.products.length;
      wishCount = wishlist.products.length;
      res.render("useraddress", { userData, cartCount, wishCount });
    } else if (cartData === null && wishlist) {
      wishCount = wishlist.products.length;
      res.render("useraddress", { userData, cartCount, wishCount });
    } else if (wishlist === null && cartData) {
      cartCount = cartData.products.length;
      res.render("useraddress", { userData, cartCount, wishCount });
    } else {
      res.render("useraddress", { userData, cartCount, wishCount });
    }
  } catch (error) {
    next(error);
  }
};

const saveAddress = async (req, res, next) => {
  try {
    const addressData = {
      name: req.body.name,
      mobile: req.body.mobile,
      home: req.body.home,
      street: req.body.street,
      district: req.body.district,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      zip: req.body.zip,
    };

    const updatedData = await User.findByIdAndUpdate(
      { _id: req.session.userId },
      {
        $push: {
          address: {
            ...addressData,
          },
        },
      }
    );

    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const addressData = {
      name: req.body.name,
      mobile: req.body.mobile,
      home: req.body.home,
      street: req.body.street,
      district: req.body.district,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      zip: req.body.zip,
    };

    const updatedata = await User.findOneAndUpdate(
      { _id: req.session.userId, "address._id": req.query.id },
      { $set: { "address.$": addressData } },
      { new: true }
    );
    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const updatedata = await User.findOneAndUpdate(
      { _id: req.session.userId },
      { $pull: { address: { _id: req.query.id } } }
    );

    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

const editProfile = async (req, res, next) => {
  try {
    let cartData;
    let wishlist;
    let userAddress;
    const userData = await User.findById({ _id: req.session.userId });
    cartData = await Cart.findOne({ userId: userData._id });
    wishlist = await Wishlist.findOne({ userId: userData._id });
    if (req.query.id) {
      userAddress = userData.address.find((p) => p._id == req.query.id);
    }

    if (cartData && wishlist) {
      cartCount = cartData.products.length;
      wishCount = wishlist.products.length;

      res.render("editprofile", {
        userData,
        cartCount,
        wishCount,
        userAddress,
      });
    } else if (cartData === null && wishlist) {
      wishCount = wishlist.products.length;
      res.render("editprofile", {
        userData,
        cartCount,
        wishCount,
        userAddress,
      });
    } else if (wishlist === null && cartData) {
      cartCount = cartData.products.length;
      res.render("editprofile", {
        userData,
        cartCount,
        wishCount,
        userAddress,
      });
    } else {
      res.render("editprofile", {
        userData,
        cartCount,
        wishCount,
        userAddress,
      });
    }
  } catch (error) {
    next(error);
  }
};

const saveProfile = async (req, res, next) => {
  try {
    const updatedData = await User.findByIdAndUpdate(
      { _id: req.session.userId },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
        },
      }
    );
    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userData = await User.findById({ _id: req.session.userId });
    const password = req.body.oldpsw;
    const newPass = req.body.newpsw;
    const passMatch = await bcrypt.compare(password, userData.password);
    if (passMatch) {
      const secure_password = await securePassword(newPass);
      const updatedData = await User.findByIdAndUpdate(
        { _id: req.session.userId },
        { $set: { password: secure_password } }
      );
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadHome,
  loadSignup,
  loadSignin,
  insertUser,
  verifyLogin,
  loadMobileOTP,
  sendOTP,
  verifyOTP,
  resetPass,
  newPass,
  resetAndSet,
  logout,
  otpLoad,
  resendOtp,
  userProfile,
  addAddress,
  saveAddress,
  editProfile,
  saveProfile,
  updateAddress,
  deleteAddress,
  contact,
  changePassword,
};
