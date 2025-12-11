const { HttpStatus } = require('../../enums/app.enums');
const { findByIdAndUpdate } = require('../../models/admin/adminModel');
const User = require('../../models/user/userSchema');


//---------------------------loading Customers--------------------------------------------------------------
exports.loadCustomers = async (req,res) => {
      const page = parseInt(req.query.page) || 1; // Get page from query or default to 1
      const limit =  8;
    try {
      const totalUsers = await User.countDocuments();
      
        const usersData = await User.find({is_admin:0})
        .skip((page-1)*limit)
        .limit(limit);
        res.render('admin/showCustomer',{
          
          users:usersData,
          currentPage: page, 
          totalPages: Math.ceil(totalUsers / limit) 
        })
    } catch (error) {
        console.log(error.message);
        
    }
}


//---------------------------Blocking Customers--------------------------------------------------------------

exports.blockUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
  
      if (!user) {
        console.log('User not found');
        return res.status(HttpStatus.NOT_FOUND).send('User not found');
      }
  
      // Toggle the is_Blocked field
      user.is_blocked = !user.is_blocked;
  
    
      await user.save();
  
      // console.log('Updated User:', user);
  
      res.redirect('/admin/customers');
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error updating user status');
    }
  };
  

