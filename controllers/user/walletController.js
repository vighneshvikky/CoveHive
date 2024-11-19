const Wallet = require('../../models/walletSchema');


exports.walletPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    
    try {
        const userId = req.session.user_id;
        
        if (!userId) {  
            return res.redirect('/login');
        }

        // First, get the wallet document for the user
        const wallet = await Wallet.findOne({ userID: userId });

        if (!wallet) {
            return res.render('user/wallet', {
                title: 'Wallet',
                wallet: { balance: 0, transaction: [] },
                currentPage: 1,
                totalPages: 1
            });
        }

        // Calculate total number of transactions for pagination
        const totalTransactions = wallet.transaction.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        // Sort and paginate transactions
        const paginatedTransactions = wallet.transaction
            .sort((a, b) => b.transaction_date - a.transaction_date)
            .slice((page - 1) * limit, page * limit);

        // Create a new wallet object with paginated transactions
        const paginatedWallet = {
            balance: wallet.balance,
            transaction: paginatedTransactions
        };

        res.render('user/wallet', {
            title: 'Wallet',
            wallet: paginatedWallet,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error(`Error while rendering user wallet: ${error}`);
        res.redirect('/login'); // or wherever you want to redirect on error
    }
};