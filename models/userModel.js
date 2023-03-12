const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  home: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zip: {
    type: Number,
    require: true,
  },
});

const applyedCoupon = new mongoose.Schema({
  year: {
    type: Date,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  Date: {
    type: String,
    required: true,
    default: Date().now,
  },
  address: [addressSchema],
  token: {
    type: String,
    default: "",
  },
  is_verified: {
    type: Number,
    default: 0,
  },
  couponsApplied: [applyedCoupon],
  wallet:{
    type: Number,
    default: 0,
    required:true
  }
});

module.exports = mongoose.model("User", userSchema);
