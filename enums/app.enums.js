const HttpStatus = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};


const OrderStatus = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    RETURNED: 'Returned',
    CANCEL: 'cancel',
    RETURN: 'return'
};


const ProductStatus = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    RETURNED: 'Returned',
    REJECTED: 'Rejected',
    REQUESTED: 'Requested',
};


const PaymentStatus = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    REFUNDED: 'Refunded'
};


const PaymentMethod = {
    COD: 'COD',
    CARD: 'Card',
    UPI: 'UPI',
    RAZORPAY: 'razorpay',
    WALLET: 'Wallet',
    NET_BANKING: 'Net Banking'
};


const TransactionType = {
    CREDITED: 'Credited',
    DEBITED: 'Debited'
};

const ActionsType = {
   APPROVE: 'approve',
   REJECT: 'reject'
}


module.exports.HttpStatus = HttpStatus;
module.exports.OrderStatus = OrderStatus;
module.exports.ProductStatus = ProductStatus;
module.exports.PaymentStatus = PaymentStatus;
module.exports.PaymentMethod = PaymentMethod;
module.exports.TransactionType = TransactionType;
module.exports.ActionsType = ActionsType