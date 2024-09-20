exports.auth = async (req,res,next) => {
    try {
        if(req.session.admin){
           
        
        }else{
             res.redirect('/admin/login')
        }
        next()
    } catch (error) {
        console.log(error.message);
         res.status(500).send('Internal Server Error');
    }
}

