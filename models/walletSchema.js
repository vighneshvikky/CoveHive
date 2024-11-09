const mongoose = require('mongoose')

const walletSchema = mongoose.Schema({
    userID :{
        type: mongoose.Schema.Types.ObjectId,
        ref:'user'
    },
    balance:{
        type : Number,
        default: 0
    },
    transaction:[{
        wallet_amount :{
            type : Number,
            default: 0
        },
        order_id:{
            type: String
        },
        transactionType:{
            type: String,
            enum:['Credited','Debited']
        },
        transaction_date:{
            type:Date,
            required: true,
            default:Date.now()
        },
    }]
}, {timestamps: true})

module.exports = mongoose.model('Wallet',walletSchema)
