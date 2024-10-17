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
        }
    },{_id:false,timestamps:true});

    const Schema = mongoose.Schema;

    const cartSchema = new Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[itemSchema],// Embed itemSchema as a subdocument
    payableAmount:{
        type:Number,
        default:0
    },
    totalPrice:{    
        type:Number,
        default:0
    }
    });

    module.exports=mongoose.model('Cart',cartSchema);
