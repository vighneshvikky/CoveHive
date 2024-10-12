const express = require('express');

const user_route = express.Router();

const passport = require('passport');

const userController = require('../../controllers/user/userController');
const userAuth = require('../../middlewares/user/userAuth');
const User = require('../../models/user/userSchema');
const ProductController = require('../../controllers/admin/productController');
const userProfile = require('../../controllers/user/userProfile');
const forgetPass = require('../../controllers/user/userForgetPass')

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

user_route.get('/profile',userProfile.loadUserProfile)

//----------------------------------edit profile ------------------------------------

user_route.post('/edit-profile',userProfile.editProfile)

//----------------------------------user address ---------------------------------------

user_route.get('/user-address',userProfile.loadAddress)
user_route.get('/add-address',userProfile.loadAddAddress)
user_route.post('/add-address',userProfile.postAddAddress)
user_route.get('/user-address-edit/:id',userProfile.editAddress)
user_route.post('/user-address-edit/:id',userProfile.postEditAddress)

//----------------------------------user Forget pass ---------------------------------------
user_route.get('/forget-password', forgetPass.loadForgotPassword);
// Route to handle forgot password
user_route.post('/forgot-password', forgetPass.forgotPassword);

// Route to serve the reset password form
user_route.get('/reset-password/:token', forgetPass.getResetPassword);

// Route to handle password reset
user_route.post('/reset-password/:token', forgetPass.postResetPassword);

//----------------------------------Google Authentication---------------------------------------

user_route.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  userController.googleAuthCallback // Controller function handles the logic
);

//--------------------------------------user logout ----------------------------------

user_route.get('/logout',userController.userLogout)
module.exports = user_route;

