const User = require('../../models/user/userSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/user/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel');

exports.getCheckoutPage = async (req,res) => {
    try {
        req.session.source = "checkout"
        if (!req.session.user) {
            req.flash('error', "User not found, please log in again");
            return res.redirect('/login');
        }
      const userId = req.session.user_id;
      const user = await User.findById(userId).populate('addresses');

      if (!user) {
        return res.status(404).send('User not found');
    }
    
    const cartDetails = await Cart.findOne({userId}).populate('items.productId');
    if (!cartDetails) {
        return res.status(404).send('Cart not found');
    }
    const items = cartDetails.items;
    if (items.length === 0) {
        return res.redirect('/cart');
    }
    for(const item of items){
        if(!item.productId.isAvailable){
            req.flash("error", "Product is not available, please remove it from the cart");
            return res.redirect("/cart");
        }
    }

    const addresses = user.addresses;

    res.render('user/checkout',{
        user,
        cartDetails,
        userDetails:user,
        addresses
    })


            
        } catch (error) {
            console.error('Error fetching addresses:', error);
            res.status(500).send('Server Error');
        }
    
}


exports.placeOrder = async (req,res) => {
    try {
        const userId = req.session.user_id;
        const {selectedAddress,paymentMethod} = req.body;
        console.log(`data from form = ${req.body}`);
        if (!selectedAddress || !paymentMethod) {
            return res.status(400).send('Invalid address or payment method');
        }
        const cart = await Cart.findOne({userId});
        if(!cart||cart.items.length === 0){
            return res.status(400).json({ message: 'Your cart is empty' });  
        }
        console.log(`cart = ${cart}`);
        const user = await User.findById(userId).populate('addresses');
        const address = user.addresses.find(addr => addr._id.toString() === selectedAddress);
        if (!address) {
            return res.status(400).send('Address not found');
        }
      const newOrder = new Order({
        userId:userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
        address: `${address.fullName}, ${address.street}, ${address.city}, ${address.state}, ${address.country}, ${address.pincode}`,
        paymentMethod: paymentMethod,
        status: 'Pending'
      })

      const orders = await newOrder.save();

      for(let item of cart.items){
        const product = await Product.findById(item.productId);
        if (product) {
            product.stock -= item.productCount; // Reduce the stock by the ordered quantity
            await product.save(); // Save the updated product stock
        }
      }
   
      cart.items = [];
      cart.totalPrice = 0;
      cart.payableAmount = 0;
      await cart.save();

      res.render('user/conform-order',{
       orders
      })
      

    } catch (error) {
       console.log(`error from placeOrder = ${error}`) 
    }
}