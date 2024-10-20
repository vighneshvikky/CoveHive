// config/cloudinary.js
const cloudinary = require('cloudinary').v2; // Importing Cloudinary SDK
require('dotenv').config();
cloudinary.config({
  cloud_name:process.env.YOUR_CLOUD_NAME , // Your Cloudinary cloud name
  api_key:process.env.YOUR_API_KEY ,       // Your Cloudinary API key
  api_secret:process.env.YOUR_API_SECRET , // Your Cloudinary API secret
});

module.exports = cloudinary; // Exporting the configured Cloudinary instance
