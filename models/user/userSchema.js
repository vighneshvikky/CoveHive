const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true }, // Add 'required' for email
    password: { type: String, required: true }, // Add 'required' for password
    phone: { type: Number },
    is_blocked: { type: Boolean, default: false },
    is_varified: { type: Number, default: 0 },
    is_admin: { type: Number, default: 0 },
    googleId: { type: String },
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }, // Add default value for createdAt
    addresses: [
        {
            fullName:{type:String,required:true},
            street: { type: String, required: true },
            city: { type: String, required: true },
            pincode: { type: String, required: true },
            state: { type: String, required: true },
            country: { type: String, required: true },
            isDefault: { type: Boolean, default: false }
        }
    ], // Add an array of addresses for multiple address management
    orders: [
        {
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Reference to an Order collection
            status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
            createdAt: { type: Date, default: Date.now }
        }
    ] // Add an array of orders for tracking order history
});


module.exports = mongoose.model('User',userSchema);