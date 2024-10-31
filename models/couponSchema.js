const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
couponCode:{
    type:String,
    required:true,
    unique:true
},
discountType:{
    type:String,
    enum:['Percentage','Fixed'],
    required:true
},
discountValue:{
    type:Number,
    required:true
},
minimumOrderAmount:{
    type:Number,
    default:0
},
startDate:{
    type:Date,
    required:true,
},
endDate:{
    type:Date,
    required:true
},
usageCount:{
type:Number,
required:true
},
isActive:{
    type:Boolean,
    default:true
}
},{timestamps:true});

module.exports = mongoose.model('Coupon',couponSchema)