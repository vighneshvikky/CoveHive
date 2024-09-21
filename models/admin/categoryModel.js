const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true ,unique:true},
  img : {type : String},
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  isBlocked: { type: Boolean, default: false },  // Used for soft delete
},{timestamps:true});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
