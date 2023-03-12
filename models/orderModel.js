const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: String,
      required: true,
      default: Date().slice(0, 24),
    },
    products: {
      type: [],
      ref: "product",
      required: true,
    },
    order_status: {
      type: String,
      require: true,
      default: "PLACED",
    },
    payment_method: {
      type: String,
      required: true,
    },
    payment_status: {
      type: String,
      required: true,
    },
    address: {
      type: ObjectId,
      required: true,
      ref: "User",
    },
    total_price: {
      type: Number,
      required: true,
    },
    applied_coupon: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", orderSchema);
