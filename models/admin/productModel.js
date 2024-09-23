const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Product name
    description: { type: String }, // Optional product description
    price: { type: Number, required: true }, // Product price
    stock: { type: Number, required: true }, // Stock count
    image: [String], // Array to hold image URLs
    category: { type: String, required: true }, // e.g., 'Apple', 'Pixel', 'Galaxy'
    subcategory: { type: String, required: true }, // e.g., 'iPhone 15 Series', 'iPhone 14 Series'
    compatibleDevices: [String], // e.g., ['iPhone 15 Pro', 'iPhone 15 Pro Max']
    ratings: { type: Number, default: 0 }, // Optional field for average ratings
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewText: String,
        rating: Number
      },
    ],
    isAvailable: { type: Boolean, default: true }, // Availability status
    createdAt: { type: Date, default: Date.now },
    isBlocked: {type:Boolean,default:false}
  });
  
  const Product = mongoose.model('Product', productSchema);

  module.exports = Product;
    