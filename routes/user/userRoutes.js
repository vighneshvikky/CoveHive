const express = require('express');

const user_route = express.Router();

const passport = require('passport');

const userController = require('../../controllers/user/userController');
const userAuth = require('../../middlewares/user/userAuth');
const User = require('../../models/user/userSchema');

user_route.get('/',userAuth.isLogout,userController.loadSignup);
user_route.post('/',userController.insertUser);

//--------------------------------for login user--------------------------------------

user_route.get('/',userAuth.isLogout,userController.loginLoad);
user_route.get('/login',userAuth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin)

//--------------------------------for userOTP ---------------------------------------
user_route.post('/verify-otp',userController.verifyOtp)
//--------------------------------resend userOTP-------------------------------------
user_route.post('/resend-otp',userController.resendOtp)

//---------------------------------home of the user ----------------------------------

user_route.get('/home',userAuth.isLogin,userController.loadHome);

//----------------------------------google authentication ---------------------------
user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

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

