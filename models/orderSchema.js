const mongoose = require('mongoose');

const orderSchema =new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
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