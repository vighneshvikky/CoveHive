const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel');

exports.listOrders = async (req,res) => {
    try {
        const orders = await Order.find().sort({createdAt:-1})
        .populate('userId')
        .populate('items.productId')
        res.render('admin/order',{orders})
    } catch (error) {
       console.log(`error from adminOrder ${error}`) 
    }
}

exports.changeOrderStatus = async (req,res) => {
    const {orderId,status} = req.body;
    try {
        const order = await Order.findById(orderId)
        if(order){
       order.status=status;
      await order.save();
      res.redirect('/admin/orders');
        }else{
            res.status(404).send('Order not found');
        }
        
    } catch (error) {
       console.log(`error form changeOrderStatus ${error}`);
    }
}


exports.viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error(`Error from viewOrderDetails: ${error}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};