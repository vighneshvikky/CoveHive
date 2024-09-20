const session = require('express-session');
const User = require('../../models/user/userSchema');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv')
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
                res.render("user/userHome");
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


exports.loadHome = async (req, res) => {
    try {
        res.render("user/userHome");
    } catch (error) {
        console.log(error);
    }
};


//------------------------------------Resend OTP-------------------------------------------------------

exports.resendOtp = async (req, res) => {
    try {
        otp = Math.floor(Math.random() * 100000); // Generate new OTP
        otpExpirationTime = Date.now() + (1 * 60 * 1000); // Reset OTP expiration

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
