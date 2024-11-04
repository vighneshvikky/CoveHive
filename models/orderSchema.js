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
        productDiscountPrice:{
            type:Number
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
    totalQuantity: {
        type: Number
    },
    totalPrice: {
        type: Number,
        required: true
    },
    priceAfterCouponDiscount:{
     type:Number,
     default:0
    },
    address: {
        contactName: String,
        street: String,
        city: String,
        state:String,
        country: String,
        pincode: Number,

    },
    paymentId: {
        type: String,
        required: false
    },
    isCancelled: {
        type: Boolean,
        default: false
    },
    couponCode:{
        type: String,
    },
    couponDiscount:{
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        required:true,
        enum: ['Cash on delivery','razorpay', 'Wallet']
    },
    paymentStatus:{
        type:String,
        required: false
    },
    orderStatus: {
        type: String,
        enum:['Pending', 'Shipped', 'Confirmed', 'Delivered', 'Cancelled', 'Returned']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Orders',orderSchema)