const mongoose = require('mongoose');

const product = mongoose.Schema({
productId : {
    type:mongoose.Schema.Types.ObjectId,
    ref:'Product'
}
},{_id:false,timestamps:true})


const wishList = mongoose.Schema({
    userId:{
        type:String
    },
    products:[product]
},{timestamps:true});

module.exports = mongoose.model('Wishlist',wishList);