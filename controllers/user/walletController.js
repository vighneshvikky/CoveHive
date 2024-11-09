const Wallet = require('../../models/walletSchema');


exports.walletPage = async (req,res)=>{
    try{
        const userId = req.session.user_id;
        let wallet = await Wallet.findOne({ userID: userId }).sort({transaction_date:-1})
        if (!userId) {
            req.flash('error', 'User Not found . Please login again.')
            return res.redirect('/login')
        }
        if (!wallet) {
            wallet = { balance: 0, transaction: [] };
        }
        res.render('user/wallet',{title:'Wallet' , wallet})
    }catch(error){
        console.log(`error while render user wallet ${error}`)
       
    }
}