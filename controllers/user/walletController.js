const Wallet = require('../../models/walletSchema');


exports.walletPage = async (req,res)=>{
    const page = parseInt(req.query.page) || 1; // Get page from query or default to 1
    const limit =  8;
    try{
        const walletCount = await Wallet.countDocuments();
        const userId = req.session.user_id;
        let wallet = await Wallet.findOne({ userID: userId }).sort({transaction_date:-1}).skip((page-1)*limit).limit(limit)
        if (!userId) {
            req.flash('error', 'User Not found . Please login again.')
            return res.redirect('/login')
        }
        if (!wallet) {
            wallet = { balance: 0, transaction: [] };
        }
        res.render('user/wallet',{title:'Wallet' , wallet,

            currentPage:page,
            totalPages:Math.ceil(walletCount/limit)

        })
    }catch(error){
        console.log(`error while render user wallet ${error}`)
       
    }
}