const express = require('express');
const admin_routes = express.Router();
const adminController = require('../../controllers/admin/adminController')
const customerController = require('../../controllers/admin/customerController');
const categoryController = require('../../controllers/admin/categoryController')
const adminAuth = require('../../middlewares/admin/adminAuth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../../public/categoryImages'))
    },
    filename:function(req,file,cb){
     const name = Date.now()+'-'+file.originalname;
     cb(null,name);
    }
})

const upload = multer({storage:storage})


//------------------------------------------ Admin login routes--------------------------------------------------------------
admin_routes.get('/login',adminController.getLoginPage);
admin_routes.post('/login', adminController.loginAdmin);

//-------------------------------------------customers management------------------------------------------------------------

admin_routes.get('/customers',adminAuth.auth,customerController.loadCustomers);
admin_routes.post('/toggle-block-user/:id',adminAuth.auth,customerController.blockUser);


//-------------------------------------------categories management------------------------------------------------------------

admin_routes.get('/categories',categoryController.loadCategories);
admin_routes.post('/categories/add',upload.single('image'),categoryController.insertCategories)


//-------------------------------------------edit categories------------------------------------------------------------

admin_routes.get('/categories/edit/:id',categoryController.editCategory)
admin_routes.post('/categories/edit/:id',upload.single('image'),categoryController.updateCategory)

module.exports = admin_routes;










