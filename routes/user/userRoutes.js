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
const wishlistController = require('../../controllers/user/wishlistController');
const walletController = require('../../controllers/user/walletController');
const pdfController = require('../../controllers/user/pdfController')

 //user_route.get('/',userAuth.isLogout,userController.loadHome);
user_route.get('/',userAuth.isLogout,userController.loadHome)


//--------------------------------for Sign Up----------------------------------------
user_route.get('/home',userAuth.isblocked,userAuth.isLogin,userController.loadHome);
user_route.get('/register',userController.loadSignup);
user_route.post('/register',userController.insertUser);

//----------------------------------google authentication ---------------------------
user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


//----------------------------------Google Authentication---------------------------------------

user_route.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  userController.googleAuthCallback // Controller function handles the logic
);

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

user_route.get('/products/:id',userAuth.isblocked, userController.loadProductDetails)

//----------------------------------edit profile ------------------------------------

user_route.post('/edit-profile',userProfile.editProfile)


//----------------------------------category page ---------------------------------

user_route.get('/category/:id',userAuth.isblocked,userController.loadCategory)

//----------------------------------user profile -----------------------------------

user_route.get('/profile',userAuth.isblocked,userAuth.isLogin,userProfile.loadUserProfile)

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
 user_route.get('/allProducts',userController.allProducts)
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

user_route.get('/orders/:id',userAuth.isLogin,orderController.viewOrderDetails)

user_route.get('/orders/dowload-pdf/:orderId',pdfController.generateOrderPDF)

//----------------------------------cancel orders ---------------------------------------

user_route.post('/cancelOrder/:id',orderController.cancelOrder);


//--------------------------------------user cart ----------------------------------
user_route.post('/cart/add/:id/:productPrice',userCart.addToCart)
user_route.get('/cart',userAuth.isload,userCart.getCart);
user_route.post('/cart/increment',userCart.increment);
user_route.post('/cart/decrement',userCart.decrement);
user_route.get('/cart/remove/:id',userCart.removeFromCart);


//--------------------------------------Check out page ----------------------------------

user_route.get('/checkout',userAuth.isload,checkOutController.getCheckoutPage); 
user_route.get('/checkout/validate',userAuth.isload,checkOutController.validateCheckout)
user_route.get('/failed-order',userAuth.isload,checkOutController.failedOrder)
//user_route.post('/place-order',checkOutController.placeOrder)
user_route.post('/place-order/:address/:payment',checkOutController.placeOrder)
user_route.get('/conform-order',userAuth.isLogin,checkOutController.orderConformPage)
//--------------------------------------Razorpay----------------------------------

user_route.post('/payment-render/:amount',checkOutController.paymentRender)
user_route.post('/retryRazorPay',orderController.retryRazorPay)
user_route.post('/retryPayment',orderController.retryPayment)
//--------------------------------------Coupon----------------------------------

user_route.post('/applyCoupon',checkOutController.applyCoupon)
user_route.post('/removeCoupon',checkOutController.removeCoupon)
user_route.get('/coupons',userAuth.isLogin,checkOutController.userCoupons)

user_route.get('/wishList',userAuth.isLogin,wishlistController.getWishlist)
user_route.post('/addWishList',userAuth.isLogin,wishlistController.postWishlist)
user_route.delete('/removeWishListItem',wishlistController.removeWishlist)

user_route.get('/wallet',userAuth.isLogin,walletController.walletPage)


//--------------------------------------user logout ----------------------------------

user_route.get('/logout',userController.userLogout)
module.exports = user_route;
                                                                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                        