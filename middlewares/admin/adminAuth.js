const { HttpStatus } = require("../../enums/app.enums");

exports. auth = async (req,res,next) => {
    try {
        if(req.session.admin){
         next();
        }else{
             res.redirect('/admin/login')
        }
      
    } catch (error) {
        console.log(error.message);
         res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal Server Error');
    }

}

