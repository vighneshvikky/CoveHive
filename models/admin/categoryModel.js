const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }  // Used for soft delete
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
