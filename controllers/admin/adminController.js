// ------------------------------Render login page--------------------------------------------------------
exports.getLoginPage = async (req, res) => {
    
   try {
    res.render('admin/adminLogin');
   } catch (error) {
    console.log(error.message);
    
   }
};

//-------------------------------handle admin login-------------------------------------------------------
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;
   
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

      req.session.admin = { email };
      console.log("Session set:", req.session); 
       res.redirect('/admin/adminDashboard');
    
    }else{
        res.render('admin/adminLogin',{message:"invalid password and email"});
    }


 
   
  };

  exports.loadDashboard = async (req,res) => {
    try {
      res.render('admin/adminDashboard')
    } catch (error) {
      console.log(error.message)
    }
  }
 

  exports.adminLogout = async (req,res) => {
    try {
      req.session.destroy((err) => {
       if(err){
        console.log(err)
       }
       res.redirect('/admin//login')
      })
    } catch (error) {
      console.log(error.message)
    }
  }
        

