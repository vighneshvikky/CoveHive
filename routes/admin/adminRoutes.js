const express = require('express');
const admin_routes = express.Router();
const adminController = require('../../controllers/admin/adminController')
const customerController = require('../../controllers/admin/customerController');
const categoryController = require('../../controllers/admin/categoryController');
const productController = require('../../controllers/admin/productController');
//const work = require('../../middlewares/multer')
const load = require('../../middlewares/multer')

//const work = require('../../middlewares/multer')

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

// admin_routes.get('/customers',adminAuth.auth,customerController.loadCustomers);
// admin_routes.post('/toggle-block-user/:id',adminAuth.auth,customerController.blockUser);

admin_routes.get('/customers',customerController.loadCustomers);
admin_routes.post('/toggle-block-user/:id',customerController.blockUser);



//-------------------------------------------categories management------------------------------------------------------------

// admin_routes.get('/categories',adminAuth.auth,categoryController.loadCategories);
// admin_routes.post('/categories/add',upload.single('img'),categoryController.insertCategories)
admin_routes.get('/categories',categoryController.loadCategories);
admin_routes.post('/categories/add',upload.single('img'),categoryController.insertCategories)

//-------------------------------------------edit categories------------------------------------------------------------

admin_routes.get('/categories/edit/:id',categoryController.editCategory)
admin_routes.post('/categories/edit/:id',upload.single('img'),categoryController.updateCategory)

//------------------------------------------blockUnblock categories-----------------------------------------------------

admin_routes.post('/categories/block-unblock/:id',categoryController.blockUnblockCategory)
module.exports = admin_routes;


//------------------------------------------Product management ----------------------------------------------------------
// admin_routes.get('/products',adminAuth.auth,productController.loadProduct);
// admin_routes.get('/addProducts',adminAuth.auth,productController.addProduct)
// admin_routes.post('/product/add',load.array('images', 10),productController.postAddProduct);
// admin_routes.post('/toggle-block-product/:id',productController.blockUnblockProduct);
// admin_routes.get('/products/edit/:id',productController.loadEditProduct);
// admin_routes.post('/products/edit/:id',load.array('images', 10),productController.postEditProduct);
// admin_routes.get('/products/delete/:id',productController.deleteProduct)


admin_routes.get('/products',productController.loadProduct);
admin_routes.get('/addProducts',productController.addProduct);
admin_routes.post('/product/add',load.array('images', 10),productController.postAddProduct);
admin_routes.post('/toggle-block-product/:id',productController.blockUnblockProduct);
admin_routes.get('/products/edit/:id',productController.loadEditProduct);
admin_routes.post('/products/edit/:id',load.array('images', 10),productController.postEditProduct);
admin_routes.get('/products/delete/:id',productController.deleteProduct)








module.exports = admin_routes   ;










