const express = require('express');

const user_route = express.Router();

const passport = require('passport');

const userController = require('../../controllers/user/userController');
const userAuth = require('../../middlewares/user/userAuth');
const userProfile = require('../../controllers/user/userProfile');
const forgetPass = require('../../controllers/user/userForgetPass')
const userCart = require('../../controllers/user/cartController');
const searchController = require('../../controllers/user/searchController')
const checkOutController= require('../../controllers/user/checkoutController')
const orderController = require('../../controllers/user/orderController');

 //user_route.get('/',userAuth.isLogout,userController.loadHome);
user_route.get('/',userAuth.isLogout,userController.loadHome)


//--------------------------------for Sign Up----------------------------------------
user_route.get('/home',userAuth.isblocked,userAuth.isLogin,userController.loadHome);
user_route.get('/register',userController.loadSignup);
user_route.post('/register',userController.insertUser);

//--------------------------------for login user--------------------------------------

//user_route.get('/',userAuth.isLogout,userController.loginLoad);
 user_route.get('/login',userAuth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin)

// user_route.get('/',userController.loginLoad);
// user_route.get('/login',userController.loginLoad);


//--------------------------------for userOTP ---------------------------------------
user_route.post('/verify-otp',userController.verifyOtp)
//--------------------------------resend userOTP-------------------------------------
user_route.post('/resend-otp',userController.resendOtp)

//---------------------------------home of the user ----------------------------------

user_route.get('/home',userAuth.isblocked,userAuth.isLogin,userController.loadHome);



//---------------------------------Product Details ----------------------------------

user_route.get('/products/:id',userController.loadProductDetails)

//----------------------------------edit profile ------------------------------------

user_route.post('/edit-profile',userProfile.editProfile)

//----------------------------------google authentication ---------------------------
user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//----------------------------------category page ---------------------------------

user_route.get('/category/:id',userController.loadCategory)

//----------------------------------user profile -----------------------------------

user_route.get('/profile',userAuth.isLogin,userProfile.loadUserProfile)

//----------------------------------edit profile ------------------------------------

user_route.post('/edit-profile',userProfile.editProfile)

//----------------------------------user address ---------------------------------------

user_route.get('/user-address',userAuth.isLogin,userProfile.loadAddress)
user_route.get('/add-address',userAuth.isLogin,userProfile.loadAddAddress)
user_route.post('/add-address',userProfile.postAddAddress)
user_route.post('/checkout-address',userProfile.checkOutAddress)
user_route.get('/user-address-edit/:id',userAuth.isLogin,userProfile.editAddress)
user_route.post('/user-address-edit/:id',userProfile.postEditAddress)
user_route.get('/user-address-remove/:id',userAuth.isLogin,userProfile.removeAddress)

//----------------------------------All Products---------------------------------------
 user_route.get('/allProducts',userAuth.isLogin,userController.allProducts)
//----------------------------------user Forget pass ---------------------------------------
user_route.get('/forget-password',forgetPass.loadForgotPassword);
user_route.post('/forgot-password', forgetPass.forgotPassword);
user_route.get('/reset-password/:token', forgetPass.getResetPassword);
user_route.post('/reset-password/:token', forgetPass.postResetPassword);

//----------------------------------user Change pass ---------------------------------------

user_route.get('/change-password',forgetPass.getChangePass)
user_route.post('/change-password',forgetPass.postChangePass)

//----------------------------------user orders ---------------------------------------

user_route.get('/orders',userAuth.isLogin,orderController.placeOrder)

//----------------------------------cancel orders ---------------------------------------

user_route.get('/cancelOrder/:id',orderController.cancelOrder)

//----------------------------------Google Authentication---------------------------------------

user_route.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  userController.googleAuthCallback // Controller function handles the logic
);
//--------------------------------------user cart ----------------------------------
user_route.post('/cart/add/:id/:productPrice',userCart.addToCart)
user_route.get('/cart',userAuth.isload,userCart.getCart);
user_route.post('/cart/increment',userCart.increment);
user_route.post('/cart/decrement',userCart.decrement);
user_route.get('/cart/remove/:id',userCart.removeFromCart);
//--------------------------------------user search ----------------------------------

 user_route.get('/search',userAuth.isLogin,searchController.searchProducts)

//--------------------------------------filter ----------------------------------

user_route.get('/products',searchController.searchAndFilterProducts);


//--------------------------------------Check out page ----------------------------------

user_route.get('/checkout',userAuth.isload,checkOutController.getCheckoutPage); 
user_route.post('/place-order',checkOutController.placeOrder)

//--------------------------------------user logout ----------------------------------

user_route.get('/logout',userController.userLogout)
module.exports = user_route;
                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                        