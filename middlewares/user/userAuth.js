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