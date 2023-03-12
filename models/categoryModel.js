const mongoose = require("mongoose");

const category = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  active:{
    type:Boolean,
    require:true,
    default:true
  }
});

module.exports = mongoose.model("Category", category);
