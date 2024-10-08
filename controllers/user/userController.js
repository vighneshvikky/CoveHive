const session = require('express-session');
const User = require('../../models/user/userSchema');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Product = require('../../models/admin/productModel');
const Category = require('../../models/admin/categoryModel');
dotenv.config()
//------------------------------------ Function to hash the password---------------------------------------
const securePassword = async (password) => {
    try {
        const hashPassword = await bcrypt.hash(password, 10);
        return hashPassword;
    } catch (error) {
        console.log(error);
    }
};
//------------------------------------ Load signup page---------------------------------------

exports.loadSignup = async (req, res) => {
    try {
        res.render('user/userSignup');
    } catch (error) {
        console.log(error);
    }
};

let email;
let otp;
let otpExpirationTime;
//------------------------------------Nodemailer configuration---------------------------------------

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',
    auth: {
        user:process.env.MY_EMAIL,
       pass:process.env.MY_PASSWORD
    }
});
//------------------------------------Send OTP -------------------------------------------------------

exports.insertUser = async (req, res) => {
    try {
        email = req.body.email;
        otp = Math.floor(Math.random() * 100000);
        otpExpirationTime = Date.now() + (1 * 60 * 1000); // OTP valid for 1 minute
         console.log(otp)
        // Store form data in session temporarily
        req.session.tempUserData = {
            fullName: req.body.fullname,
            email: req.body.email,
            phone: req.body.phone,
            password: req.body.password, 
        };

        // Email options
        let mailOptions = {
            to: req.body.email,
            subject: "OTP for registration",
            html: "<h3>OTP for account verification is:</h3>" +
                "<h1 style='font-weight:bold;'>" + otp + "</h1>"
        };

        // Send OTP email
        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.log(err);
                return res.render('user/userSignup', { message: "Failed to send OTP" });
            }
            res.render("user/userOtp");
        });

    } catch (error) {
        console.log(error);
    }
};

//------------------------------------Verify OTP and create the user after verification-------------------------------------------------------

exports.verifyOtp = async (req, res) => {
    try {
        const userOtp = req.body.otp;
        const currentTime = Date.now();

        if (currentTime > otpExpirationTime) {
            res.render("user/userOtp", { msg: "Time expired" });
        } else if (userOtp == otp) {
            // OTP verified
            const tempUserData = req.session.tempUserData;
            if (tempUserData) {
                const spassword = await securePassword(tempUserData.password); // Hash the password

                const user = new User({
                    fullName: tempUserData.fullName,
                    email: tempUserData.email,
                    phone: tempUserData.phone,
                    password: spassword,
                });

                const userData = await user.save(); // Save user to the database
                req.session.user_id = userData._id; // Set session user ID after registration
                res.redirect("/home");
            } else {
                res.render("user/userSignup", { message: "Session expired, please try signing up again" });
            }

        } else {
            res.render("user/userOtp", { msg: "OTP is incorrect" });
        }

    } catch (error) {
        console.log(error.message);
    }
};


exports.loginLoad = async (req, res) => {
    try {
        res.render('user/userLogin'); 
    } catch (error) {
        console.log(error.message);
        
    }
};


//------------------------------------ Verify login credentials-------------------------------------------------------


exports.verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email });
         if (userData) {
            const isPasswordMatch = await bcrypt.compare(password, userData.password);
            if(userData.is_blocked){

                    res.render('user/userLogin',{msg:"Your account has been blocked"})
                 }
         else if(isPasswordMatch) {
                req.session.user_id = userData._id;
                req.session.fullName = userData.fullName;
                
                
                res.redirect("/home");
            } else {
                res.render('user/userLogin', { message: 'Password or email is incorrect' });
            }
                 
        }
         else {
            res.render('user/userLogin', { message: 'Password or email is incorrect' });
        }
    } catch (error) {
        console.log(error);
    }
};

//------------------------------------Load home page-------------------------------------------------------
exports.loadLanding = async (req,res) => {
    try {
        const limit = 10; // Number of items per page
        const page = parseInt(req.query.page) || 1; // Current page number
        const skip = (page - 1) * limit; // Number of documents to skip
        
        const products = await Product.find({ isBlocked: false })
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .skip(skip) // Skip the previous pages
            .limit(8); // Limit to 'limit' items
        const totalProduct = await Product.countDocuments({ isBlocked: false }); // Get total count of products
        const categories = await Category.find({ isBlocked: false });
        
        res.render("user/landingPage", {
            products,
            categories,
            currentPage: page,
            totalPages: Math.ceil(totalProduct / limit)
        });
        

    } catch (error) {
        console.log(error.message)
    }
}

exports.loadHome = async (req, res) => {
    try {
        const limit = 10; // Number of items per page
        const page = parseInt(req.query.page) || 1; // Current page number
        const skip = (page - 1) * limit; // Number of documents to skip
        const products = await Product.find({isBlocked:false})  
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .skip(skip) // Skip the previous pages
        .limit(8); // Limit to 'limit' items
        const totalProduct = await Product.countDocuments({ isBlocked: false }); // Get total count of products
        const categories = await Category.find({isBlocked:false}); 
        console.log(req.session)
        const userName = req.session.userName;
        res.render("user/userHome",{
            products,
            categories,
            currentPage: page,
            totalPages: Math.ceil(totalProduct / limit),
            userName
        });
    } catch (error) {
        console.log(error);
    }
};


//------------------------------------Resend OTP-------------------------------------------------------

exports.resendOtp = async (req, res) => {
    try {
        otp = Math.floor(Math.random() * 100000); // Generate new OTP
        otpExpirationTime = Date.now() + (1 * 60 * 1000); // Reset OTP expiration
         console.log(`resend OTP :${otp}`)
        let mailOptions = {
            to: email,
            subject: "OTP for registration",
            html: "<h3>This is the Otp</h3>" + otp
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.log(error);
                res.render('user/userOtp', { msg: "Failed to resend OTP" });
            } else {
                res.render('user/userOtp', { msg: "OTP has been sent" });
            }
        });

    } catch (error) {
        console.log(error.message);
    }
};


// -------------------------------------------load category------------------------------------------------

exports.loadCategory = async (req, res) => {
    const categoryId = req.params.id;
    const limit = 8; // Number of items per page
    const page = parseInt(req.query.page) || 1; // Current page number
    const skip = (page - 1) * limit; // Number of documents to skip

    try {
        // Fetch the category by ID
        const category = await Category.findById(categoryId);

        // Get the total count of products in the category (excluding blocked ones)
        const totalProducts = await Product.countDocuments({ isBlocked: false, category: categoryId });
         const userName =  req.session.user_id
        // Fetch the products for the current page, with pagination
        const products = await Product.find({ isBlocked: false, category: categoryId })
            .skip(skip)  // Skip the first 'skip' number of products
            .limit(limit);  // Limit the result to 'limit' number of products
    
        // Calculate the total number of pages
        const totalPages = Math.ceil(totalProducts / limit);
        // Render the view with category, products, and pagination details
        res.render('user/userCategory', {
            category,
            products,
            currentPage: page,
            totalPages,
            userName // total number of pages
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred while fetching category products.");
    }
};


//-----------------------------------------user google ----------------------------------------------


exports.googleAuthCallback = async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });
  
      if (user.is_blocked) {
        return res.render('user/userSignup', { message: 'Your Account has Been blocked' });
      }
  
      // Set session data
      req.session.user_id = user._id;
      req.session.userName = user.fullName;
  
      // Pass session data to the view
      const userName = req.session.userName;
      console.log(req.session.userName + " hai");
  
      // Render home page with the userName
       res.redirect('/home');
      
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
