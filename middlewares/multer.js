const multer = require('multer');
const path = require('path');

// Set up storage for images
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads')); // Ensure this directory exists
    },
    filename: function(req, file, cb) {
        // Create a unique filename using the timestamp and original name
        const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '-'); // Replace spaces with hyphens
        cb(null, name);
    }
});

// Create upload middleware for multiple files
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB (optional)
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/; // Acceptable file types
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    }
});

module.exports = upload;

// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const cloudinary = require('../config/cloudinary');


// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//       folder: 'products', // Folder name in Cloudinary
//       allowed_formats: ['jpg', 'png', 'jpeg'],
//       transformation: [{ width: 500, height: 500, crop: 'limit' }], // Crop and limit the image size
//     },
//   });


//   const upload = multer({ storage: storage });


//   module.exports = upload;
  