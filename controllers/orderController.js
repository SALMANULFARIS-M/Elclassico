const User = require("../models/userModel");
const Product = require("../models/poductsModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Razorpay = require("razorpay");
var crypto = require("crypto");

//Razorpay
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayId = process.env.RAZORPAY_KEY_ID;
let instance = new Razorpay({
  key_id: razorpayId,
  key_secret: razorpaySecret,
});

const loadCheckout = async (req, res, next) => {
  try {
    let cartData;
    let wishlist;
    let cartCount;
    let wishCount;
    const userData = await User.findById({ _id: req.session.userId });
    cartData = await Cart.findOne({ userId: userData._id }).populate(
      "products.productId"
    );
    wishlist = await Wishlist.findOne({ userId: userData._id });
    const coupon = await Coupon.find({});
    let address = [0];

    if (!cartData.products.length == 0) {
      if (cartData && wishlist) {
        cartCount = cartData.products.length;
        wishCount = wishlist.products.length;
        address = userData.address;
        res.render("checkout", {
          userData,
          cartData,
          cartCount,
          wishCount,
          address,
          coupon,
        });
      } else if (wishlist === null && cartData) {
        cartCount = cartData.products.length;
        address = userData.address;
        res.render("checkout", {
          userData,
          cartData,
          cartCount,
          wishCount,
          address,
          coupon,
        });
      }
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const saveOrder = async (req, res, next) => {
  try {
    let userData;
    let cartData;
    const payment_method = req.body.payment;
    const wallet = Number(req.body.wallet);
    userData = await User.findById({ _id: req.session.userId });
    cartData = await Cart.findOne({ userId: userData._id });
    await User.findByIdAndUpdate(
      { _id: req.session.userId },
      { $set: { wallet: wallet } }
    );
    const addressId = req.body.address;
    const address = await userData.address.find((p) => p._id == addressId);
    const total = Number(req.body.total);
    let coupon;
    if (req.session.coupon) {
      coupon = req.session.coupon;
    }

    if (total == 0) {
      const totalAmount = Number(req.body.productTotalAmount);
      const order = await new Order({
        userId: userData._id,
        products: cartData.products,
        total_price: totalAmount,
        address: address,
        payment_method: "wallet",
        payment_status: "COMPLETED",
        applied_coupon: coupon,
      });
      const orderData = await order.save();
      res.json({ success: true });
    } else {
      if (payment_method == "COD") {
        const order = await new Order({
          userId: userData._id,
          products: cartData.products,
          total_price: total,
          address: address,
          payment_method: payment_method,
          payment_status: "PENDING",
          applied_coupon: coupon,
        });

        await order.save();
        res.json({ success: "COD" });
      } else if (payment_method == "Razorpay") {
        const order = await new Order({
          userId: userData._id,
          products: cartData.products,
          total_price: total,
          address: address,
          payment_method: payment_method,
          payment_status: "PENDING",
          applied_coupon: coupon,
        });

        const orderData = await order.save();
        const orderId = orderData._id;
        let options = {
          amount: total * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: "" + orderId,
        };
        instance.orders.create(options, function (err, order) {
          res.json({ success: "Razorpay", order });
        });
      }
    }
  } catch (error) {
    console.log(error.message);
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

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const paymentVerify = async (req, res, next) => {
  try {
    const payment = req.body.payment;
    const order = req.body.order;

    const hmac_sha256 = (data, razorpaySecret) => {
      return crypto
        .createHmac("sha256", razorpaySecret)
        .update(data)
        .digest("hex");
    };

    const generated_signature = hmac_sha256(
      payment.razorpay_order_id + "|" + payment.razorpay_payment_id,
      razorpaySecret
    );
    if (generated_signature == payment.razorpay_signature) {
      await Order.findByIdAndUpdate(
        { _id: order.receipt },
        { $set: { payment_status: "COMPLETED" } }
      );
      res.json({ success: true });
    } else {
      await Order.findByIdAndRemove({ _id: order.receipt });
      res.json({ success: false });
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const orderConfirm = async (req, res, next) => {
  try {
    let userData;
    let wishlist;
    let orderData;
    let cartCount;
    let wishCount;
    if (req.headers.referer && req.headers.referer.endsWith("/checkout")) {
      orderData = await Order.findOne({ userId: req.session.userId })
        .sort({ createdAt: -1 })
        .populate("products.productId");
      const products = orderData.products;
      const user = await User.findById({
        _id: orderData.userId,
        "address._id": orderData.address,
      });
      const orderAddress = user.address[0];
      wishlist = await Wishlist.findOne({ userId: userData._id });
      const deletedData = await Cart.updateOne(
        { userId: orderData.userId },
        {
          $unset: { products: "" },
        }
      );

      if (req.session.coupon) {
        await User.findByIdAndUpdate(req.session.userId, {
          $push: {
            couponsApplied: {
              year: new Date().toJSON().slice(0, 10),
              code: req.session.coupon,
            },
          },
        });
      }

      for (const products of orderData.products) {
        const product = await Product.findOne({ _id: products.productId });
        const newStock = product.stocks - products.quantity;
        await Product.updateOne(
          { _id: products.productId },
          { $set: { stocks: newStock } }
        );
      }

      cartData = await Cart.findOne({ userId: userData._id });
      if (wishlist) {
        wishCount = wishlist.products.length;
        res.render("orderconfirm", {
          orderData,
          orderAddress,
          products,
          userData,
          wishCount,
          cartCount,
        });
      } else if (wishlist === null) {
        res.render("orderconfirm", {
          orderData,
          orderAddress,
          products,
          userData,
          wishCount,
          cartCount,
        });
      }
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const myOrder = async (req, res, next) => {
  try {
    let userData;
    let cartData;
    let wishlist;
    let orderData;
    let cartCount;
    let wishCount;
    userData = await User.findById({ _id: req.session.userId });
    cartData = await Cart.findOne({ userId: userData._id });
    wishlist = await Wishlist.findOne({ userId: userData._id });
    orderData = await Order.find({ userId: userData._id })
      .populate("products.productId")
      .sort({ createdAt: -1 });

    if (cartData && wishlist) {
      cartCount = cartData.products.length;
      wishCount = wishlist.products.length;
      wishlist = wishlist.products;
      res.render("myorder", { userData, cartCount, wishCount, orderData });
    } else if (cartData === null && wishlist) {
      wishCount = wishlist.products.length;
      wishlist = wishlist.products;
      res.render("myorder", { userData, cartCount, wishCount, orderData });
    } else if (wishlist === null && cartData) {
      cartCount = cartData.products.length;
      wishlist = [0];
      res.render("myorder", { userData, cartCount, wishCount, orderData });
    } else {
      wishlist = [0];
      res.render("myorder", { userData, cartCount, wishCount, orderData });
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const orderDetails = async (req, res, next) => {
  try {
    let userData;
    let cartData;
    let wishlist;
    let orderData;
    userData = await User.findById({ _id: req.session.userId });
    cartData = await Cart.findOne({ userId: userData._id });
    wishlist = await Wishlist.findOne({ userId: userData._id });
    orderData = await Order.findById({ _id: req.query.id }).populate(
      "products.productId"
    );
    const user = await User.findById({
      _id: orderData.userId,
      "address._id": orderData.address,
    });
    const orderAddress = user.address[0];

    if (cartData && wishlist) {
      cartCount = cartData.products.length;
      wishCount = wishlist.products.length;
      wishlist = wishlist.products;
      res.render("orderdetails", {
        userData,
        cartCount,
        wishCount,
        orderData,
        orderAddress,
      });
    } else if (cartData === null && wishlist) {
      wishCount = wishlist.products.length;
      wishlist = wishlist.products;
      res.render("orderdetails", {
        userData,
        cartCount,
        wishCount,
        orderData,
        orderAddress,
      });
    } else if (wishlist === null && cartData) {
      cartCount = cartData.products.length;
      wishlist = [0];
      res.render("orderdetails", {
        userData,
        cartCount,
        wishCount,
        orderData,
        orderAddress,
      });
    } else {
      wishlist = [0];
      res.render("orderdetails", {
        userData,
        cartCount,
        wishCount,
        orderData,
        orderAddress,
      });
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const loadOrder = async (req, res, next) => {
  try {
   const orderData = await Order.find({}).populate("userId").sort({ createdAt: -1 });
    const pCount = await Order.find({
      order_status: "PLACED",
    }).count();
    const sCount = await Order.find({
      order_status: "SHIPPED",
    }).count();
    const ofdCount = await Order.find({
      order_status: "OUT FOR DELIVERY",
    }).count();
    const dCount = await Order.find({
      order_status: "DELIVERED",
    }).count();
    const cCount = await Order.find({
      order_status: "CANCELLED",
    }).count();
    const rCount = await Order.find({
      order_status: "RETURNED",
    }).count();
    res.render("orderlist", {
      orderData,
      pCount,
      sCount,
      ofdCount,
      dCount,
      cCount,
      rCount,
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const viewOrder = async (req, res, next) => {
  try {
    const id = req.query.id;
    const orderData = await Order.findById({ _id: id })
      .populate("products.productId")
      .populate("userId");
    let address = await User.findOne(
      { _id: orderData.userId, "address._id": orderData.address },
      { "address.$": 1 }
    );

    res.render("orderinfo", { orderData, address });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const orderData = await Order.findByIdAndUpdate(
      { _id: req.query.id },
      {
        $set: {
          payment_status: req.body.payment,
          order_status: req.body.order,
        },
      }
    );
    res.redirect("/admin/orders");
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const orderData = await Order.findById({ _id: req.query.id }).populate(
      "products.productId"
    );

    for (const products of orderData.products) {
      const product = await Product.findOne({ _id: products.productId });
      const newStock = product.stocks + products.quantity;
      await Product.updateOne(
        { _id: products.productId },
        { $set: { stocks: newStock } }
      );
    }
    await Order.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { order_status: "CANCELLED", payment_status: "CANCELLED" } }
    );
    res.redirect("/myorder");
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const returnOrder = async (req, res, next) => {
  try {
    await Order.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { order_status: "RETURNREQ" } }
    );
    res.redirect("/myorder");
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const returnApprove = async (req, res, next) => {
  try {
    const orderData = await Order.findByIdAndUpdate(
      { _id: req.params.orderId },
      {
        $set: {
          order_status: "RETURNED",
          payment_status: "RETURNED",
        },
      }
    );
    const update = await User.findByIdAndUpdate(
      { _id: orderData.userId },
      { $inc: { wallet: orderData.total_price } }
    );
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const coupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.find({});
    res.render("coupon", { coupon });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const addCoupon = async (req, res, next) => {
  try {
    res.render("addcoupon");
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const saveCoupon = async (req, res, next) => {
  try {
    const name = req.body.coupon;
    const existData = await Coupon.findOne({
      code: { $regex: name, $options: "i" },
    });

    if (!existData) {
      const percentage = req.body.disc_per;
      const max_dis = req.body.max_disc;
      const Amount = req.body.min_amount;
      const date = new Date(req.body.date);
      const coupon = new Coupon({
        code: name,
        discountPercentage: percentage,
        maxDiscount: max_dis,
        minAmount: Amount,
        expDate: date,
      });

      const coupenData = await coupon.save();
      res.redirect("/admin/coupon");
    } else {
      const message = "Already Exist";
      res.render("addcoupon", { message });
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete({ _id: req.query.id });
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const applyCoupon = (req, res, next) => {
  try {
    if (req.body.cancel) {
      req.session.coupon = null;
      res.json({ success: true });
    } else {
      const couponCode = req.body.coupon;
      let total = Number(req.body.price);

      Coupon.findOne(
        {
          code: couponCode,
        },
        (err, coupon) => {
          if (!err) {
            if (coupon) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const exp = coupon.expDate;
              exp.setHours(0, 0, 0, 0);
              if (exp.getTime() < today.getTime()) {
                let responseData = {
                  price: total,
                  message: "This coupon is Expired!",
                  discount: 0,
                };
                res.json(responseData);
              } else {
                if (total >= coupon.minAmount) {
                  User.aggregate([
                    {
                      $match: {
                        _id: req.session.userId,
                      },
                    },
                    {
                      $project: {
                        couponsApplied: 1,
                      },
                    },
                    {
                      $unwind: {
                        path: "$couponsApplied",
                      },
                    },
                    {
                      $match: {
                        "couponsApplied.code": coupon,
                      },
                    },
                  ])
                    .then((result) => {
                      if (result.length > 0) {
                        console.log(result);
                        console.log("This coupon is already used!");
                        let responseData = {
                          price: total,
                          message: "This coupon is already used!",
                          discount: 0,
                        };

                        res.json(responseData);
                      } else {
                        // success case;
                        // user didn't used the coupon before;

                        // save coupon in session
                        req.session.coupon = couponCode;
                        let discountPrice =
                          (total * coupon.discountPercentage) / 100;

                        if (discountPrice <= coupon.maxDiscount) {
                          total = Math.round(total - discountPrice);
                          let responseData = {
                            price: total,
                            discount: Math.round(discountPrice),
                            message: "",
                          };
                          res.json(responseData);
                        } else {
                          total = Math.round(total - coupon.maxDiscount);
                          let responseData = {
                            price: total,
                            discount: coupon.maxDiscount,
                            message: "",
                          };
                          res.json(responseData);
                        }
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                      // console.log("error in finding coupondata");
                      let responseData = {
                        price: total,
                        message:
                          "something went wrong while applying coupon! try again later",
                        discount: 0,
                      };
                      res.json(responseData);
                    });
                } else {
                  let responseData = {
                    price: total,
                    message: "Minimum amount is" + coupon.minAmount,
                    discount: 0,
                  };
                  res.json(responseData);
                }
              }
            } else {
              let responseData = {
                price: total,
                message: "coupon not exist",
                discount: 0,
              };
              res.json(responseData);
            }
          } else {
            res.json({
              price: total,
              message:
                "something went wrong while applying coupon! try again later",
              discount: 0,
            });
          }
        }
      );
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

module.exports = {
  loadCheckout,
  saveOrder,
  loadOrder,
  viewOrder,
  updateOrder,
  coupon,
  addCoupon,
  saveCoupon,
  deleteCoupon,
  myOrder,
  orderDetails,
  cancelOrder,
  orderConfirm,
  applyCoupon,
  paymentVerify,
  returnOrder,
  returnApprove,
  saveAddress,
};
