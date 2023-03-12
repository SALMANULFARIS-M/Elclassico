const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  gross_price: {
    type: Number,
    required: true,
  },
  offer_price: {
    type: Number,
    required: true,
  },
  image: {
    type: Array,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  stocks: {
    type: Number,
    required: true,
  },
  category: {
    type: ObjectId,
    required: true,
    ref: "Category",
  },
  description: {
    type: String,
    required: true,
  },
  active:{
    type:Boolean,
    require:true,
    default:true
  }
});

module.exports = mongoose.model("product", productSchema);
