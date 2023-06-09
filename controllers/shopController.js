const User = require("../models/userModel");
const Product = require("../models/poductsModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

let message;
const limit = 6;

const viewProduct = async (req, res, next) => {
  try {
    let cartData;
    let wishlist;
    let cartCount;
    let wishCount;
    if (req.session.userId) {
      const id = req.query.id;
      const product = await Product.findById({
        _id: id,
        active: true,
      }).populate("category");
      const userData = await User.findById({ _id: req.session.userId });
      cartData = await Cart.findOne({ userId: userData._id });
      wishlist = await Wishlist.findOne({ userId: userData._id });

      if (cartData && wishlist) {
        cartCount = cartData.products.length;
        wishCount = wishlist.products.length;
        wishlist = wishlist.products;
        res.render("productdetail", {
          userData,
          product,
          cartCount,
          wishCount,
          wishlist,
        });
      } else if (cartData === null && wishlist) {
        wishCount = wishlist.products.length;
        wishlist = wishlist.products;
        res.render("productdetail", {
          userData,
          product,
          cartCount,
          wishCount,
          wishlist,
        });
      } else if (wishlist === null && cartData) {
        cartCount = cartData.products.length;
        wishlist = [0];
        res.render("productdetail", {
          userData,
          product,
          cartCount,
          wishCount,
          wishlist,
        });
      } else {
        wishlist = [0];
        res.render("productdetail", {
          userData,
          product,
          cartCount,
          wishCount,
          wishlist,
        });
        s;
      }
    } else {
      let userData;
      const id = req.query.id;
      const product = await Product.findById({
        _id: id,
        active: true,
      }).populate("category");
      res.render("productdetail", { userData, product, cartCount, wishCount });
    }
  } catch (error) {
    next(error);
  }
};

const loadShop = async (req, res, next) => {
  try {
    let productData;
    let cartData;
    let wishlist;
    let cartCount;
    let wishCount;
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const categories = await Category.find({ active: true });
    productData = await Product.find({
      active: true,
    })
      .populate("category")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Product.find({
      active: true,
    }).countDocuments();
    if (req.session.userId) {
      const userData = await User.findById({ _id: req.session.userId });
      wishlist = await Wishlist.findOne({ userId: userData._id });
      cartData = await Cart.findOne({ userId: userData._id });
      if (cartData && wishlist) {
        cartCount = cartData.products.length;
        wishCount = wishlist.products.length;
        wishlist = wishlist.products;
        res.render("shop", {
          userData,
          product: productData,
          category: categories,
          cartCount,
          wishCount,
          wishlist,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      } else if (cartData === null && wishlist) {
        wishCount = wishlist.products.length;
        wishlist = wishlist.products;
        res.render("shop", {
          userData,
          product: productData,
          category: categories,
          cartCount,
          wishCount,
          wishlist,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      } else if (wishlist === null && cartData) {
        cartCount = cartData.products.length;
        wishlist = [0];
        res.render("shop", {
          userData,
          product: productData,
          category: categories,
          cartCount,
          wishCount,
          wishlist,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      } else {
        wishlist = [0];
        res.render("shop", {
          userData,
          product: productData,
          category: categories,
          cartCount,
          wishCount,
          wishlsit,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        });
      }
    } else {
      let userData;
      res.render("shop", {
        userData,
        product: productData,
        category: categories,
        cartCount,
        wishCount,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    }
  } catch (error) {
    next(error);
  }
};

const loadCart = async (req, res, next) => {
  try {
    let cartData;
    let wishlist;
    let cartCount;
    let wishCount;
    let products = [];
    if (req.session.userId) {
      const userData = await User.findById({ _id: req.session.userId });
      cartData = await Cart.findOne({ userId: userData._id }).populate(
        "products.productId"
      );
      wishlist = await Wishlist.findOne({ userId: userData._id });

      if (cartData && wishlist) {
        cartCount = cartData.products.length;
        wishCount = wishlist.products.length;

        res.render("cart", {
          userData,
          cartData,
          products,
          cartCount,
          wishCount,
        });
      } else if (cartData === null && wishlist) {
        wishCount = wishlist.products.length;
        res.render("cart", {
          userData,
          cartData,
          products,
          cartCount,
          wishCount,
        });
      } else if (wishlist === null && cartData) {
        cartCount = cartData.products.length;
        res.render("cart", {
          userData,
          cartData,
          products,
          cartCount,
          wishCount,
        });
      } else if (wishlist === null && cartData === null) {
        res.render("cart", {
          userData,
          cartData,
          products,
          cartCount,
          wishCount,
        });
      }
    } else {
      let userData;
      res.render("cart", { userData });
    }
  } catch (error) {
    next(error);
  }
};

const addCart = async (req, res, next) => {
  try {
    let id = req.params.productId;

    const productData = await Product.findById({ _id: id });
    let cartData = await Cart.findOne({ userId: req.session.userId });

    if (cartData) {
      let existData = await Cart.findOne({
        userId: req.session.userId,
        products: { $elemMatch: { productId: id } },
      });
      if (existData === null) {
        let product = {
          productId: productData._id,
          quantity: 1,
          price: productData.offer_price,
        };

        cartData = await Cart.findOneAndUpdate(
          { _id: cartData._id },
          {
            $push: {
              products: {
                ...product,
              },
            },
          }
        );
        const success = true;
        res.json({ success, message: "Successfully added to Cart" });
      } else {
        await Cart.findOneAndUpdate(
          { userId: req.session.userId, "products.productId": id },
          { $inc: { "products.$.quantity": 1 } }
        );

        let cart = await Cart.findOne({
          userId: req.session.userId,
          "products.productId": id,
        });
        let quantity = cart.products.find((p) => p.productId == id).quantity;
        const price = quantity * productData.offer_price;
        const updatedCart = await Cart.findOneAndUpdate(
          { userId: req.session.userId, "products.productId": id },
          { $set: { "products.$.price": price } }
        );
        const success = true;
        res.json({ success, message: "Product added again to Cart" });
      }
    } else {
      let cart = new Cart({
        userId: req.session.userId,
        products: [
          {
            productId: productData._id,
            quantity: 1,
            price: productData.offer_price,
          },
        ],
      });
      const saveCart = await cart.save();
      const success = true;
      res.json({ success, message: "Successfully added to Wishlist" });
    }
  } catch (error) {
    next(error);
  }
};

const removeCart = async (req, res, next) => {
  try {
    const deletedData = await Cart.updateOne(
      { userId: req.session.userId },
      {
        $pull: { products: { productId: req.query.id } },
      }
    );

    res.redirect("/cart");
  } catch (error) {
    next(error);
  }
};

const increment = async (req, res, next) => {
  try {
    let id = req.params.productId;
    const productData = await Product.findById({ _id: id });

    //update quantity and price
    await Cart.findOneAndUpdate(
      { userId: req.session.userId, "products.productId": id },
      {
        $inc: {
          "products.$.quantity": 1,
          "products.$.price": productData.offer_price,
        },
      }
    );

    //Updated cart Data of a Product
    const cartData = await Cart.findOne({
      userId: req.session.userId,
      "products.productId": id,
    });

    //updated price of a product by quantity
    let updatedPrice = cartData.products.find((p) => p.productId == id).price;

    //for totalprice and stock
    let products = cartData.products;
    let prices = products.map((products) => products.price);
    let sum = prices.reduce((sum, num) => sum + num);

    res.json({ updatedPrice, sum });
  } catch (error) {
    next(error);
  }
};

const decrement = async (req, res, next) => {
  try {
    let id = req.params.productId;
    let cartData = await Cart.findOne({
      userId: req.session.userId,
      "products.productId": id,
    });
    let quantity = cartData.products.find((p) => p.productId == id).quantity;

    //check for quantity greater than 1
    if (quantity > 1) {
      //update quantity and price
      const productData = await Product.findById({ _id: id });
      await Cart.findOneAndUpdate(
        { userId: req.session.userId, "products.productId": id },
        {
          $inc: {
            "products.$.quantity": -1,
            "products.$.price": -productData.offer_price,
          },
        }
      );

      //Updated cart Data of a Product
      const cartData = await Cart.findOne({
        userId: req.session.userId,
        "products.productId": id,
      });

      //updated price of a product by quantity
      let updatedPrice = cartData.products.find((p) => p.productId == id).price;

      //for totalprice
      let products = cartData.products;
      let prices = products.map((products) => products.price);
      let sum = prices.reduce((sum, num) => sum + num);
      res.json({ updatedPrice, sum });
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    next(error);
  }
};

const loadWishlist = async (req, res, next) => {
  try {
    let cartData;
    let wishlist;
    let cartCount;
    let wishCount;
    let products = [];
    if (req.session.userId) {
      const userData = await User.findById({ _id: req.session.userId });
      wishlist = await Wishlist.findOne({ userId: userData._id });
      cartData = await Cart.findOne({ userId: userData._id });

      if (cartData && wishlist) {
        cartCount = cartData.products.length;
        wishCount = wishlist.products.length;
        let productsId = wishlist.products;

        products = await Product.find({ _id: { $in: productsId } }).populate(
          "category"
        );

        res.render("wishlist", { userData, products, cartCount, wishCount });
      } else if (cartData === null && wishlist) {
        wishCount = wishlist.products.length;
        const productsId = wishlist.products;
        products = await Product.find({ _id: { $in: productsId } }).populate(
          "category"
        );
        res.render("wishlist", { userData, products, cartCount, wishCount });
      } else if (wishlist === null && cartData) {
        cartCount = cartData.products.length;
        res.render("wishlist", { userData, products, cartCount, wishCount });
      } else {
        res.render("wishlist", { userData, products, cartCount, wishCount });
      }
    } else {
      res.redirect("/signin");
    }
  } catch (error) {
    next(error);
  }
};

const addWishlist = async (req, res, next) => {
  try {
    let id = req.params.productId;
    let productData;
    let wishlist;
    productData = await Product.findById({ _id: id });
    wishlist = await Wishlist.findOne({ userId: req.session.userId });

    if (wishlist) {
      let existData = await Wishlist.findOne({
        userId: req.session.userId,
        products: { $elemMatch: { $in: [id] } },
      });

      if (existData === null) {
        wishlist = await Wishlist.findOneAndUpdate(
          { userId: req.session.userId },
          {
            $push: {
              products: id,
            },
          }
        );

        let success = true;
        res.json({ success });
      } else {
        message = "already added";
        res.json({ message });
      }
    } else {
      let wishlist = new Wishlist({
        userId: req.session.userId,
        products: [id],
      });

      await wishlist.save();

      const success = true;
      res.json({ success });
    }
  } catch (error) {
    next(error);
  }
};

const removeWishlist = async (req, res, next) => {
  try {
    if (req.params.productId) {
      let id = req.params.productId;
      const deletedData = await Wishlist.updateOne(
        { userId: req.session.userId },
        {
          $pull: { products: id },
        }
      );
    } else {
      let id = req.query.id;
      const deletedData = await Wishlist.updateOne(
        { userId: req.session.userId },
        {
          $pull: { products: id },
        }
      );
      res.redirect("/wishlist");
    }
  } catch (error) {
    next(error);
  }
};


const search = async (req, res) => {
  try {
    let page = parseInt(req.body.page) || 1;
    let searchQuery = req.body.search || '';
    let categoryIds = req.body.category || null;
    let sortOption = req.body.sort || '';

    const query = {
      $or: [
        { name: { $regex: ".*" + searchQuery + ".*", $options: "i" } },
        { brand: { $regex: ".*" + searchQuery + ".*", $options: "i" } },
      ],
    };

    if (categoryIds && categoryIds.length > 0) {
      query.category = { $in: categoryIds };
    }

    let sort = {};

    switch (sortOption) {
      case 'Low to high':
        sort = { offer_price: 1 };
        break;
      case 'High to low':
        sort = { offer_price: -1 };
        break;
    }

    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const count = await Product.countDocuments(query);

    const totalPages = Math.ceil(count / limit);

    res.json({
      products: products,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    res.render('error', { message: 'An error occurred' });
  }
};


module.exports = {
  viewProduct,
  loadShop,
  loadCart,
  addCart,
  removeCart,
  increment,
  decrement,
  loadWishlist,
  addWishlist,
  removeWishlist,
  search,
};
