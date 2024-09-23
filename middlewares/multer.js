const multer = require('multer');
const path = require('path');

// // Define storage for images
// const storage = multer.diskStorage({

//     //--------------------- files will be saved location -----------------------

//     destination: function(req,file,cb){
//         cb(null,'../public/uploads')
//     },

//     //------------------ file name of the file to be saved ---------------------

//     filename: function (req, file, cb) {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//         cb(null, uniqueSuffix + `-${file.originalname}`)
//     }
// })

// const upload = multer({
//     storage:storage,
// })

// module.exports = upload ;

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/uploads'))
    },
    filename:function(req,file,cb){
     const name = Date.now()+'-'+file.originalname;
     cb(null,name);
    }
})

const upload = multer({storage:storage})

 module.exports = upload ;