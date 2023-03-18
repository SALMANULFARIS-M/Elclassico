const express = require("express");
const user_route = express();
const bodyParser = require("body-parser");

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;

const auth = require("../middleware/auth");

//set views path for user
user_route.set("views", "./views/users");

// controllers
const uc = require("../controllers/userController");
const sc = require("../controllers/shopController");
const oc = require("../controllers/orderController");

//user side validation
user_route.get("/signup", auth.isLogout, uc.loadSignup);
user_route.post("/signup", uc.insertUser);
user_route.get("/signin", auth.isLogout, uc.loadSignin);
user_route.post("/signin", uc.verifyLogin);
user_route.get("/mobileotp", auth.isLogout, uc.loadMobileOTP);
user_route.post("/mobileotp", uc.sendOTP);
user_route.get("/otpverify",auth.isLogout, uc.otpLoad);
user_route.post("/otpverify", uc.verifyOTP);
user_route.get("/resendotp", auth.isLogout, uc.resendOtp);
user_route.post("/forget_password", uc.resetPass);
user_route.get("/reset_password", auth.isLogout, uc.newPass);
user_route.post("/reset_password", uc.resetAndSet);
user_route.get("/logout", auth.isLogin, uc.logout);

//home
user_route.get("/", uc.loadHome);
user_route.get("/contact", uc.contact);
user_route.get("/profile", auth.isLogin, uc.userProfile);
user_route.get("/editprofile", auth.isLogin, uc.editProfile);
user_route.post("/editprofile", auth.isLogin, uc.saveProfile);
user_route.post('/changepassword',auth.isLogin,uc.changePassword)
user_route.get("/saveaddress", auth.isLogin, uc.addAddress);
user_route.post("/saveaddress", auth.isLogin, uc.saveAddress);
user_route.post("/updateaddress", auth.isLogin, uc.updateAddress);
user_route.get("/deleteaddress", auth.isLogin, uc.deleteAddress);

//user side shop manage
user_route.get("/viewproduct", sc.viewProduct);
user_route.get("/shop", sc.loadShop);
user_route.get("/cart", auth.loginPage, sc.loadCart);
user_route.get("/addcart/:productId",auth.isLogin, sc.addCart);
user_route.get("/removecart", auth.isLogin, sc.removeCart);
user_route.get("/cart/:productId", auth.isLogin, sc.increment);
user_route.post("/cart/:productId", auth.isLogin, sc.decrement);
user_route.get("/wishlist", auth.isLogin, sc.loadWishlist);
user_route.get("/addwishlist/:productId", auth.isLogin, sc.addWishlist);
user_route.get("/removewishlist/:productId", auth.isLogin, sc.removeWishlist);
user_route.get("/removewishlist", auth.isLogin, sc.removeWishlist);
user_route.post("/search", sc.search);
// user_route.post("/sortprice",sc.sortPrice);

//user side order manage
user_route.get("/myorder", auth.isLogin, oc.myOrder);
user_route.get("/checkout", auth.isLogin, oc.loadCheckout);
user_route.post("/checkout", auth.isLogin, oc.saveOrder);
user_route.post('/checkoutaddress',auth.isLogin,oc.saveAddress)
user_route.get("/confirm", auth.isLogin, oc.orderConfirm);
user_route.get("/vieworder", auth.isLogin, oc.orderDetails);
user_route.get("/cancelorder", auth.isLogin, oc.cancelOrder);
user_route.get("/returnorder", auth.isLogin, oc.returnOrder);
user_route.post("/applycoupon", auth.isLogin, oc.applyCoupon);
user_route.post("/paymentverify", auth.isLogin, oc.paymentVerify);

module.exports = user_route;