const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
  maxDiscount: {
    type: Number,
    required: true,
  },
  minAmount: {
    type: Number,
    required: true,
  },
  expDate:{
    type:Date,
    required:true
  }
});

module.exports = mongoose.model("Coupon", couponSchema);
