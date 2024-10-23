const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
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
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, enum: ['COD', 'Online'], default: 'COD' },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        zip: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Order',orderSchema); 