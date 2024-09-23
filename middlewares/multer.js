const multer = require('multer');
const path = require('path');

// Define storage for images
const storage = multer.diskStorage({

    //--------------------- files will be saved location -----------------------

    destination: function(req,file,cb){
        cb(null,'../public/uploads')
    },

    //------------------ file name of the file to be saved ---------------------

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + `-${file.originalname}`)
    }
})

const upload = multer({
    storage:storage,
})

module.exports = upload ;