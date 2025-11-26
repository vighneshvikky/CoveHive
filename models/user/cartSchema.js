    const mongoose = require('mongoose');

    const itemSchema = new mongoose.Schema({
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        productCount:{
            type:Number,
            default:1,
        },
        productPrice:{
            type:Number,
            required:true
        },
        productImage:{
            type:String
        },
        productDiscountPrice:{
            type:Number
        }
    },{_id:false,timestamps:true});

    const Schema = mongoose.Schema;

    const cartSchema = new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[itemSchema],
    payableAmount:{
        type:Number,
        default:0
    },
    couponId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Coupon'
    },
    couponDiscount:{
        type:Number,
        default:0
    },
    isCouponApplied:{
type:Boolean,
default:false
    },
    totalPrice:{    
        type:Number,
        default:0
    }
    });

    module.exports=mongoose.model('Cart',cartSchema);
