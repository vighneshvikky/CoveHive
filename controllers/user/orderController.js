const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel')
const Wallet = require('../../models/walletSchema')
exports.placeOrder = async(req,res) => {

    try {
        const page = parseInt(req.query.page)||1;
        const limit = 4
      
        const orderCount = await Order.countDocuments();
        const user = req.session.user_id;
        if (!user) {
            req.flash('error', "User not found. Please login again.");
            return res.redirect("/login");
        }
      

        const orderDetails = await Order.find({userId:user}).populate({path:'items.productId'}).sort({ createdAt:-1}).skip((page-1)*limit).limit(limit);
         
        res.render('user/order',{
            orderDetails,
            currentRoute:'/home',
            currentPage:page,
            totalPage:Math.ceil(orderCount/limit),
            returnMessage: req.session.returnMessage || ''
        })
    } catch (error) {
        console.log(`error from placeOrder ${error}`)
    }

}

exports.cancelOrder = async (req,res) => {
    try {

     const orderId = req.params.id;
       
        const {action,reason,productId} = req.body;
 
        if(!productId){
            return res.json({ success: false, message: 'Invalid order ID' });
        }
        const order = await Order.findById(orderId);
            
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }
        if (order.paymentMethod === 'razorpay' || order.paymentMethod === 'Wallet' ) {
            const userWallet = await Wallet.findOne({ userID: order.userId });
            if (userWallet) {
                userWallet.balance = (userWallet.balance || 0) + order.totalPrice;
                userWallet.transaction.push({
                    wallet_amount: order.totalPrice,
                    order_id: order.orderId,
                    transactionType: 'Credited',
                    transaction_date: new Date()
                });
                await userWallet.save();
            } else {
                await Wallet.create({
                    userID: order.userId,
                    balance: order.totalPrice,
                    transaction: [{
                        wallet_amount: order.totalPrice,
                        order_id: order.orderId,
                        transactionType: 'Credited',
                        transaction_date: new Date()
                    }]
                });
            }
        }

const item = order.items.find(item => item.productId.toString() === productId);

if(item){
    item.productStatus = action === 'return'?'Requested':'Cancelled';
    item.reasonForCancellation = action ==='cancel'?reason:null;
    item.reasonForReturn = action === 'return'?reason:null;
}



        
         console.log(`order = ${order}`)
        await order.save();
        return res.json({ success: true });
    } catch (error) {
     console.log(`error form cancelOrder:${error.message}`)
     res.json({ success: false, message: 'Cannot cancel this order right now, please try again' });
    }
}

exports.viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('items.productId').exec();

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
    
       
        res.json(order);
    } catch (error) {
        console.error(`Error from viewOrderDetails: ${error}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};