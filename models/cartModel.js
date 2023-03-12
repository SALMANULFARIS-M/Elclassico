const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema({
  productId: {
    type: ObjectId,
    required: true,
    ref: "product",
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
  products: [productsSchema],
});

module.exports = mongoose.model("Cart", cartSchema);
