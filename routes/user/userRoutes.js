const express = require('express');

const user_route = express.Router();

const passport = require('passport');

const userController = require('../../controllers/user/userController');
const userAuth = require('../../middlewares/user/userAuth');
const User = require('../../models/user/userSchema');
const ProductController = require('../../controllers/admin/productController');

 user_route.get('/',userAuth.isLogout,userController.loadHome);
//user_route.get('/',userController.loadLanding)


//--------------------------------for Sign Up----------------------------------------
user_route.get('/home',userController.loadHome);
user_route.get('/register',userController.loadSignup);
user_route.post('/register',userController.insertUser);

//--------------------------------for login user--------------------------------------

user_route.get('/',userAuth.isLogout,userController.loginLoad);
 user_route.get('/login',userAuth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin)

// user_route.get('/',userController.loginLoad);
// user_route.get('/login',userController.loginLoad);


//--------------------------------for userOTP ---------------------------------------
user_route.post('/verify-otp',userController.verifyOtp)
//--------------------------------resend userOTP-------------------------------------
user_route.post('/resend-otp',userController.resendOtp)

//---------------------------------home of the user ----------------------------------

user_route.get('/home',userAuth.isLogin,userController.loadHome);

//user_route.get('/home',userController.loadHome);

//---------------------------------Product Details ----------------------------------

user_route.get('/products/:id',ProductController.loadProductDetails)

//----------------------------------google authentication ---------------------------
user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//----------------------------------category page ---------------------------------

user_route.get('/category/:id',userController.loadCategory)

//----------------------------------forget password -------------------------------



// Google OAuth callback route
user_route.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  async(req,res) => {
    try {
      const user =await User.findOne({email:req.user.email});
      console.log(user)
     if(user.is_blocked){
      res.render('user/userSignup',{message:'Your Account has Been blocked'})
     }else{
      res.redirect('/home')
     }

    } catch (error) {
      console.log(error.message);
      
    } 
  }
);

module.exports = user_route;

