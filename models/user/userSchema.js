const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName:{type:String,required:true},
    email:{type:String},
    password:{type:String},
    phone:{type:Number},
    is_blocked:{type:Boolean,default:false},
    is_varified:{type:Number,default:0},
    is_admin:{type:Number,default:0},
    googleId: { type: String } 
});


module.exports = mongoose.model('User',userSchema);