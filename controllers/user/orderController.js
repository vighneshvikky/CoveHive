const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel')
const Wallet = require('../../models/walletSchema')
const Razorpay =  require('razorpay');
const Cart = require('../../models/user/cartSchema')
require('dotenv').config();
exports.placeOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        
        // Get user from session
        const user = req.session.user_id;
        if (!user) {
            req.flash('error', "User not found. Please login again.");
            return res.redirect("/login");
        }

        // Calculate total orders for the specific user
        const orderCount = await Order.countDocuments({ userId: user });

        // Fetch orders with pagination and populate product details
        const orderDetails = await Order.find({ userId: user })
            .populate({ path: 'items.productId' })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        // Render the order page
        res.render('user/order', {
            orderDetails,
            currentRoute: '/home',
            currentPage: page,
            totalPage: Math.ceil(orderCount / limit),
            returnMessage: req.session.returnMessage || ''
        });

        // Clear the return message after rendering
        req.session.returnMessage = '';

    } catch (error) {
        console.error(`Error in placeOrder: ${error}`);
        
    }
};

exports.cancelOrder = async (req,res) => {
    try {
console.log('hai')
     const orderId = req.params.id;
    
        const {action,reason,productId} = req.body;
        console.log(`action = ${action}`)   
 
        if(!productId){
            return res.json({ success: false, message: 'Invalid order ID' });
        }
        const order = await Order.findById(orderId);
        order.orderStatus='Cancelled'
            
        if (!order) {
            return res.json({ success: false, message: 'Order not found' });
        }
       if(action == 'cancel'){
        if(order.paid){
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
        }
       }
 


const item = order.items.find(item => item.productId.toString() === productId);

if(item){
    item.productStatus = action === 'return'?'Requested':'Cancelled';
    item.reasonForCancellation = action ==='cancel'?reason:null;
    item.reasonForReturn = action === 'return'?reason:null;
}

const product = await Product.findById(productId);

console.log(`product = ${product}`)
if(product){
    product.stock += item.productCount;
    await product.save();
}else{
    return res.json({ success: false, message: 'Product not found in inventory' });
}

console.log(`after = ${product.stock}`)

        
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

const razorpay = new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET
});


exports.retryRazorPay = async(req,res) =>{
    try {
        console.log(`hi from retryRazorPay`)
        const { orderId } = req.body;
        const order = await Order.findById(orderId);

        console.log(`order = ${order}`)

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.totalPrice * 100),
            currency: "INR",
            receipt: `receipt#${orderId}`
        });

        if (razorpayOrder) {
            return res.status(200).json({
                ...order.toObject(),
                razorpayOrderId: razorpayOrder  
            });
        } else {
            return res.status(500).send('Razorpay order creation failed');
        } 
    } catch (error) {
       console.log(`error from retryRazorPay ${error}`) 
       res.status(500).send('Internal Server Error');
    }
}

exports.retryPayment = async (req,res) =>{
    try {
        const { orderId, paymentId, razorpayOrderId } = req.body;
        const update = {
            paymentId: paymentId,
            paymentStatus: 'Success',
            orderStatus: 'Pending',
            paid:true
        };
        const order = await Order.findByIdAndUpdate(orderId, update, { new: true });
        if (!order) {
            return res.status(404).send('Order not found');
        }
        for (let product of order.items) {
            await Product.findByIdAndUpdate(product.productId, {
                $inc: { stock: -product.productCount }
            });
        }
        await Cart.deleteOne({ userId:req.session.user_id});
        res.status(200).json(order);
    } catch (error) {
        console.log(`error from retryPayment ${error}`)
        res.status(500).send('Internal Server Error');
    }
}