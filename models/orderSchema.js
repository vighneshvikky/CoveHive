const mongoose = require('mongoose');

const orderSchema =new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId:{
        type:Number
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName:{
            type:String
        },
        productCategory:{
            type:String
        },
        productCount: {
            type: Number,
            required: true
        },
        productPrice: {
            type: Number,
            required: true
        },
        productImage: {
            type: String
        },
        productDiscount: {
            type: Number
        },
        productStatus:{
            type: String,
            enum:['Confirmed','Shipped', 'Pending', 'Delivered', 'Returned', 'Cancelled'],
            default:'Pending'

        }
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    isCancel: {
        type: Boolean,
        default: false
    },
    paymentMethod: {
        type: String,
        default: 'Cash on Delivery'
    },
    status: {
        type: String,
        enum:['Pending', 'Shipped', 'Confirmed', 'Delivered', 'Cancelled', 'Returned']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Orders',orderSchema)