const express = require('express');
const admin_routes = express.Router();
const adminController = require('../../controllers/admin/adminController')
const customerController = require('../../controllers/admin/customerController');
const adminAuth = require('../../middlewares/admin/adminAuth')



//------------------------------------------ Admin login routes--------------------------------------------------------------
admin_routes.get('/login',adminController.getLoginPage);
admin_routes.post('/login', adminController.loginAdmin);

//-------------------------------------------customers management------------------------------------------------------------

admin_routes.get('/customers',adminAuth.auth,customerController.loadCustomers);
admin_routes.post('/toggle-block-user/:id',adminAuth.auth,customerController.blockUser);


module.exports = admin_routes;





