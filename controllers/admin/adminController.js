
const Admin = require('../../models/admin/adminModel');
const bcrypt = require('bcryptjs');

// ------------------------------Render login page--------------------------------------------------------
exports.getLoginPage = (req, res) => {
    
   try {
    res.render('admin/adminLogin');
   } catch (error) {
    console.log(error.message);
    
   }
};

//-------------------------------handle admin login-------------------------------------------------------
exports.loginAdmin = (req, res) => {
    const { email, password } = req.body;
   
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

      req.session.admin = { email };
      console.log("Session set:", req.session); 
       res.render('admin/adminDashboard');
    
    }else{
        res.status(400).send('Invalid email or password');
    }


 
   
  };
 
        

