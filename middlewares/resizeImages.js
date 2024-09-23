const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const resizeImages = async (req, res, next) => {
  if (!req.files) return next(); // If no files are uploaded, proceed without errors

  const resizedImages = [];
  await Promise.all(
    req.files.map(async (file) => {
      const newFileName = `resized-${Date.now()}-${file.originalname}`;
      const outputPath = path.join('public/uploads/products', newFileName);

      await sharp(file.path)
        .resize(500, 500) // Resize image to 500x500px
        .toFile(outputPath);

      // Push the resized file name to the array and remove the original file
      resizedImages.push(newFileName);
      fs.unlinkSync(file.path); // Delete original image to save space
    })
  );

  req.body.images = resizedImages; // Add resized image paths to the request body
  next();
};

module.exports = resizeImages;
