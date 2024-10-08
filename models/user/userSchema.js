const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName:{type:String,required:true},
    email:{type:String,unique:true},
    password:{type:String},
    phone:{type:Number},
    is_blocked:{type:Boolean,default:false},
    is_varified:{type:Number,default:0},
    is_admin:{type:Number,default:0},
    googleId: { type: String },
    createdAt: { type: Date }, 
});


module.exports = mongoose.model('User',userSchema);