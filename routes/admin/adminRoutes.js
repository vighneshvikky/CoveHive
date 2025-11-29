const express = require('express');
const admin_routes = express.Router();
const adminController = require('../../controllers/admin/adminController')
const customerController = require('../../controllers/admin/customerController');
const categoryController = require('../../controllers/admin/categoryController');
const productController = require('../../controllers/admin/productController');
const orderController = require('../../controllers/admin/orderController');
const couponController = require('../../controllers/admin/couponController');
const salesController = require('../../controllers/admin/salesController');
const offerController = require('../../controllers/admin/offerController')
const load = require('../../middlewares/multer')

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

 admin_routes.get('/categories',adminAuth.auth,categoryController.loadCategories);
admin_routes.post('/categories/add',upload.single('img'),categoryController.insertCategories)


//-------------------------------------------edit categories------------------------------------------------------------

admin_routes.get('/categories/edit/:id',categoryController.editCategory)
admin_routes.post('/categories/edit/:id',upload.single('img'),categoryController.updateCategory)

//------------------------------------------blockUnblock categories-----------------------------------------------------

admin_routes.post('/categories/block-unblock/:id',categoryController.blockUnblockCategory)
module.exports = admin_routes;


//------------------------------------------Product management ----------------------------------------------------------
admin_routes.get('/products',adminAuth.auth,productController.loadProduct);
admin_routes.get('/addProducts',adminAuth.auth,productController.addProduct)
admin_routes.post('/product/add',load.array('images', 10),productController.postAddProduct);
admin_routes.post('/toggle-block-product/:id',productController.blockUnblockProduct);
admin_routes.get('/products/edit/:id',productController.loadEditProduct);
admin_routes.post('/products/edit/:id',load.array('images', 10),productController.postEditProduct);
admin_routes.get('/products/delete/:id',productController.deleteProduct)
admin_routes.post('/product/remove-image/:id',productController.removeImage)

//------------------------------------------ order Management-----------------------------------------------------

admin_routes.get('/orders',adminAuth.auth,orderController.listOrders);
admin_routes.post('/orders/status',orderController.changeOrderStatus);
admin_routes.get('/viewReason/:orderId/:productId',adminAuth.auth,orderController.viewReturnReason);
admin_routes.post('/processReturn/:orderId/:productId',orderController.postViewReason);
admin_routes.get('/orders/details/:orderId', orderController.orderDetails)
//admin_routes.post('/orders/cancel',orderController.cancelOrder);
admin_routes.get('/orders/:id',orderController.viewOrderDetails)

//------------------------------------------ order Management-----------------------------------------------------

admin_routes.get('/coupons',adminAuth.auth,couponController.getCoupon);
admin_routes.get('/addCoupon',adminAuth.auth,couponController.addCoupon)
admin_routes.post('/addCouponPost',couponController.postAddCoupon);
admin_routes.patch('/removeCoupon/:couponId',adminAuth.auth,couponController.removeCoupon);
admin_routes.get('/editCoupon',adminAuth.auth,couponController.editCoupon);
admin_routes.post('/editCouponPost',couponController.editCouponPost)


//------------------------------------------sales-----------------------------------------------------

admin_routes.get('/salesReport',adminAuth.auth,salesController.sales)
admin_routes.get('/salesReoprtView',adminAuth.auth,salesController.salesReoprtView);
admin_routes.get('/exportReport',adminAuth.auth,salesController.exportReport)

//------------------------------------------offers-----------------------------------------------------


admin_routes.get('/offers',adminAuth.auth,offerController.offers);
admin_routes.post('/addOffer',offerController.addOfferPost);
admin_routes.post('/removeOffer',offerController.removeOffer);

//------------------------------------------dashboard-----------------------------------------------------


 admin_routes.get('/dashboard',adminAuth.auth,adminController.dashboard);
 admin_routes.post('/dashboard',adminAuth.auth,adminController.dashboard);
 admin_routes.get('dasboardFilter',adminAuth.auth,adminController.dashboardFilter)


//----------------------------------------Logout ------------------------------------------------------------------------


admin_routes.get('/logout',adminController.adminLogout);


module.exports = admin_routes   ;










