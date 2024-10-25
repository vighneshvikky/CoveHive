exports. auth = async (req,res,next) => {
    try {
        if(req.session.admin){
         next();
        }else{
             res.redirect('/admin/login')
        }
      
    } catch (error) {
        console.log(error.message);
         res.status(500).send('Internal Server Error');
    }

}

