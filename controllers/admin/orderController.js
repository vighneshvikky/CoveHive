const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel');
exports.listOrders = async (req,res) => {
    try {
        const orders = await Order.find().sort({createdAt:-1})
        .populate('userId')
        .populate('items.productId')
        console.log(orders);
        
        res.render('admin/order',{orders})
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