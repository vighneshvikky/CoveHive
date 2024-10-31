const session = require('express-session');
const User = require('../../models/user/userSchema');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Product = require('../../models/admin/productModel');
const Category = require('../../models/admin/categoryModel');
const { isblocked } = require('../../middlewares/user/userAuth');
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
//----------------------------------- Load signup page---------------------------------------

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
                req.session.fullName = tempUserData.fullName;
                const user = new User({
                    fullName: tempUserData.fullName,
                    email: tempUserData.email,
                    phone: tempUserData.phone,
                    password: spassword,
                });
               
                const userData = await user.save(); // Save user to the database
                req.session.user_id = userData._id; // Set session user ID after registration
                req.session.user = userData;
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
                req.session.user = userData;
                req.session.user_id = userData._id;
                req.session.fullName = userData.fullName;
                req.session.isBlocked = userData.is_blocked
                
                
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
        // console.log(req.session)
        // const userName =   req.session.fullName;
        // console.log(userName)
        const user = await User.findById(req.session.user_id)
        res.render("user/userHome",{
            products,
            categories,
            currentPage: page,
            totalPages: Math.ceil(totalProduct / limit),
            user,
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
        const user = await User.findById(req.session.user_id)
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
            user // total number of pages
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
      req.session.user=user;
      req.session.user_id = user._id;
      req.session.fullName = user.fullName;
  
      // Pass session data to the view
      
      console.log(req.session.fullName+"hai");
  
      // Render home page with the userName
       res.redirect('/home');
      
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  };

  exports.loadProductDetails = async (req,res) => {
    const productId = req.params.id; // Get the product ID from the URL parameters
    try {
        const product = await Product.findById(productId); // Fetch the product by ID directly
        const relatedProducts = await Product.find({
          isBlocked:false,
          category:product.category,
          _id:{$ne:product._id}
        }).limit(4)
        if (!product) { 
            return res.status(404).send('Product not found'); // Handle case where product doesn't exist
        }
        const user = await User.findById(req.session.user_id)
        res.render('user/productDetails', {
           product,
           relatedProducts,
           currentRoute:'/home',
           user 
          }); // Render the product details EJS template
    } catch (error) {
        console.log(error.message)
    }
  }


  //-----------------------------------------------user Logout---------------------------


  exports.userLogout = async (req,res) => {
    try {
       req.session.destroy((err) => {
        if(err){
            console.log(err.message)
        }
        res.redirect('/login')
       })
    } catch (error) {
        console.log(error.message)
    }
  }

  exports.allProducts = async (req, res) => {
    try {
        const categoryFilter = req.query.category || "all";
        const sortOption = req.query.sort || "latest";
        const searchQuery = req.query.search || "";
    
        // Pagination settings
        const page = parseInt(req.query.page) || 1; // default to page 1
        const limit = 8;
        const skip = (page - 1) * limit;
    
        let filterOption={isBlocked:false};
        if (categoryFilter !== "all") {
          const category = await Category.findOne({ name: categoryFilter });
          if (!category) {
            return res.status(400).send("category not found");
          }
          filterOption.category = category._id;
        }
    
        if (searchQuery) {
          filterOption.name = { $regex: searchQuery, $options: 'i' };
        }
      
         
        // Fetch all products based on the filter
        const products = await Product
        .find(filterOption)
        .populate("category", "name")
        .lean();

    
        // Calculate discounted price for all products
        // for (let product of products) {
        //   product.discountedPrice = await calculateDiscountPrice(product);
        // }
    
        // Sort products based on the selected sort option
        switch (sortOption) {
          case 'discount':
            products.sort((a, b) => {
              const priceA = a.discountedPrice !== undefined ? a.discountedPrice : a.price; 
              const priceB = b.discountedPrice !== undefined ? b.discountedPrice : b.price; 
              return priceA - priceB; // Sort by discounted price (low to high)
            });
            break;
          case 'discount-desc':
            products.sort((a, b) => {
              const priceA = a.discountedPrice !== undefined ? a.discountedPrice : a.price; 
              const priceB = b.discountedPrice !== undefined ? b.discountedPrice : b.price; 
              return priceB - priceA; // Sort by discounted price (high to low)
            });
            break;
          case 'a-z':
            products.sort((a, b) => a.name.localeCompare(b.name)); 
            break;
          case 'z-a':
            products.sort((a, b) => b.name.localeCompare(a.name)); 
            break;
          default:
            products.sort((a, b) => b.createdAt - a.createdAt); 
            break;
        }




        
         //const products = await Product.find({isBlocked:false})
        // Apply pagination to the sorted products
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const paginatedProducts = products.slice(skip, skip + limit);
    
        const categories = await Category.find({ isBlocked: false });
    
        res.render('user/allProducts', {
          product: paginatedProducts,
          categories,
          categoryFilter,
          currentPage: page,
          totalPages,
          sortOption,
          searchQuery,
          products
        });
    
      } catch (error) {
        console.log("Error in all products page", error);
        
      }
    }