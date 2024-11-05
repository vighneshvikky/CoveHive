const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel')
const Wallet = require('../../models/walletSchema')
exports.placeOrder = async(req,res) => {
    try {
        const user = req.session.user_id;
        if (!user) {
            req.flash('error', "User not found. Please login again.");
            return res.redirect("/login");
        }
      

        const orderDetails = await Order.find({userId:user}).populate({path:'items.productId',select:"name"}).sort({ createdAt:-1})
        console.log(orderDetails); 
        console.log(`orderDetails = ${orderDetails}`)
        res.render('user/order',{
            orderDetails,
            currentRoute:'/home'
        })
    } catch (error) {
        console.log(`error from placeOrder ${error}`)
    }

}

exports.cancelOrder = async (req,res) => {
    try {
console.log('hai');

        const orderId = req.params.id;
 
        if(!orderId){
            req.flash('error', 'Invalid order ID');
            return res.redirect('/orders');
        }
        const order = await Order.findById(orderId);
            
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
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

        for(const item of order.items){
            item.productStatus = "Cancelled"
            const product = await Product.findById(item.productId);
            if(product){
                product.stock += item.productCount;
                await product.save();
            }

        }
        await order.save();
        req.flash('success', 'Order cancelled successfully');
        res.redirect('/orders');
    } catch (error) {
     console.log(`error form cancelOrder:${error.message}`)
     req.flash('error', 'Cannot cancel this order right now, please try again');
        res.redirect('/orders');
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