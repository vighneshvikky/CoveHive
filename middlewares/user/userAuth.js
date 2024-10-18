const User = require('../../models/user/userSchema')

exports.isLogin = async (req,res,next) => {
    try {
        
     if(req.session.user_id){}
     else{
        res.redirect('/');
     }

    } catch (error) {
        console.log(error.message);
        
    }

    next()
}
  
exports.isLogout = async (req,res,next) => {
    try {
        
     if(req.session.user_id){
         //res.redirect('/')
     }
     next();

    } catch (error) {
        console.log(error.message);
        
    }
}

exports.isload = async (req,res,next)=>{
    try {
        if(req.session.user_id){
            next();
        }else{
            res.redirect('/login')
        }
       
    } catch (error) {
      console.log(error.message)  
    }
}

exports.isblocked = async (req,res,next) => {
    try {
        
        const user = await User.findById(req.session.user_id);
       if(user){
        if(user.is_blocked){
            req.session.destroy((err) => {
                if(err){
                    console.log(err)
                }
                return res.render('block',{message:"Your Account has been Blocked"})
            })
           
        }
       }
         next()   
    } catch (error) {
        console.log(error.message)
    }
}






