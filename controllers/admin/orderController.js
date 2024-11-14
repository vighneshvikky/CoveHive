const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel');
const Wallet = require('../../models/walletSchema');
const User = require('../../models/user/userSchema');
exports.listOrders = async (req,res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    try {

        const totalOrders = await Order.countDocuments(); 
        const orders = await Order.find().sort({createdAt:-1})
        .skip((page-1)*limit)
        .limit(limit)
        .populate('userId')
        .populate('items.productId')
        
        res.render('admin/order',{
            orders,
            currentPage:page,
            totalPages:Math.ceil(totalOrders/limit)
        })
    } catch (error) {
       console.log(`error from adminOrder ${error}`) 
    }
}


exports.changeOrderStatus = async (req, res) => {
    const { orderId, productId, status } = req.body;

    try {
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.json({ success: false, error: "Order not found" });
        }
        
        // Find the product within the order and update its status
        const item = order.items.find(item => item.productId.toString() === productId);
        if (!item) {
            return res.json({ success: false, error: "Product not found in the order" });
        }
        
        item.productStatus = status;
       if(item.productStatus == 'Delivered'){
        order.orderStatus = 'Pending'
       }    

        console.log(`product Status = ${item.productStatus}`)
        await order.save();
        
        return res.json({ success: true });
    } catch (error) {
        console.error("Error updating status:", error);
        return res.json({ success: false, error: "Failed to update status" });
    }
};




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

exports.viewReturnReason = async (req,res) =>{
    try {
        const {orderId,productId} = req.params;
        const order = await Order.findById(orderId).populate('items.productId');

        const item = order.items.find(item => item.productId._id.toString() === productId);

        if(item&&item.reasonForReturn){
            res.render('admin/returnReason', { order, item, reasonForReturn: item.reasonForReturn });
        }else{
            res.status(404).send('Return reason not found or item does not exist.');
        }
    } catch (error) {
       console.log(`error from viewReturnReason ${error}`) 
       res.status(500).send('Error retrieving order details');
    }
}


exports.postViewReason = async(req,res) =>{
    const {orderId,productId} = req.params;
    const {action} = req.body;
    console.log(`action = ${action}`)
    try {
        const order = await Order.findById(orderId);
        const userId = await User.findById(order.userId);
        const item = order.items.find(item => item.productId._id.toString() === productId);
    console.log(`item = ${item}`)
        if(item){
            if(action === 'approve'){
                item.productStatus = 'Returned';
                const userWallet = await Wallet.findOne({userId:userId});
                if(userWallet){
                    userWallet.balance = (userWallet.balance || 0) + order.totalPrice;
                    userWallet.transaction.push({
                        wallet_amount: order.totalPrice,
                        order_id: order.orderId,
                        transactionType: 'Credited',
                        transaction_date: new Date()
                    });
                    await userWallet.save();
                }else{
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
               
               
            }else if(action == 'reject'){   
                item.productStatus = "Rejected"
        
      
            }else{
                res.status(400).send('Invalid action');
            }
        }else{
            res.status(404).send('Item not found');
        }

        await order.save();

        res.redirect('/admin/orders')
    } catch (error) {
        console.log(`error from postViewReason ${error}`)
    }
}