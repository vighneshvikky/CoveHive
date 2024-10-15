const Product = require('../../models/admin/productModel');
const Cart = require('../../models/user/cartSchema');
const User = require('../../models/user/userSchema')

exports.addToCart = async (req,res) => {
    try {
        
        const productId = req.params.productId;
        const userId = req.session.user_id;  // Assuming the user is logged in and their ID is stored in the session
       console.log(`user id is ${userId}`)
        // Fetch product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the cart exists for the user
        let cart = await Cart.findOne({ userId });

        // If no cart, create a new one
        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                totalQuantity: 0,
                totalPrice: 0
            });
        }

        // Check if the product is already in the cart
        const cartItem = cart.items.find(item => item.productId.equals(productId));

        if (cartItem) {
            // If the item exists in the cart, increase the quantity
            cartItem.quantity += 1;
            cartItem.price += product.price;
        } else {
            // If not in the cart, add the item
            cart.items.push({
                productId: product._id,
                quantity: 1,
                price: product.price
            });
        }

        // Update cart totals
        cart.totalQuantity += 1;
        cart.totalPrice += product.price;

        // Save the cart
        await cart.save();
        res.status(200).json({
            message: 'Product added to cart successfully!',
            cartItemCount: 5 // Example: Pass cart count if needed
        });
    } catch (error) {
      console.log(error.message);
      res.json({ success: false, message: "Failed to add to cart!" });  
    }
}

exports.getCart = async (req,res) => {
    try {
        const userId = req.session.user_id;  // Assuming user is logged in
        const cart = await Cart.findOne({ userId }).populate('items.productId');  // Populate product details
        const user = await User.findById(req.session.user_id)
        res.render('user/userCart', { cart ,user});
    } catch (error) {
      console.log(error.message)  
    }
}
exports.updateCart = async (req, res) => {
    try {
        const { quantity } = req.body; // Get quantity from request body
        const productId = req.params.productId; // Get productId from route params
        const userId = req.session.user_id; // Get userId from session

        // Define the maximum limit for adding to cart
        const MAX_QUANTITY = 5;

        // Find the user's cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Find the cart item by productId
        const cartItem = cart.items.find(item => item.productId.equals(productId));
        if (!cartItem) {
            return res.json({ success: false, message: "Item not found in cart." });
        }

        // Find the product by its ID
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if the new quantity is valid (must be greater than 0 and not exceed the limit)
        const newQuantity = parseInt(quantity, 10);
        if (newQuantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }
        if (newQuantity > MAX_QUANTITY) {
            return res.status(400).json({ success: false, message: `You can only add up to ${MAX_QUANTITY} items of this product.` });
        }

        // Check if stock is sufficient
        if (newQuantity > product.stock) {
            return res.status(400).json({ success: false, message: 'Insufficient stock available' });
        }

        // Calculate the change in quantity and price
        const quantityChange = newQuantity - cartItem.quantity;
        cartItem.quantity = newQuantity;
        cartItem.price = newQuantity * product.price;

        // Update the total quantity and price for the cart
        cart.totalQuantity += quantityChange;
        cart.totalPrice += quantityChange * product.price;

        // Update product stock
        product.stock -= quantityChange; // Reduce stock based on the change in quantity
        if (product.stock < 0) product.stock = 0; // Prevent negative stock

        // Save the updated product and cart
        await product.save();
        await cart.save();

        return res.json({ success: true, message: "Cart updated successfully." });

    } catch (error) {
        console.error('Error updating cart:', error.message);
        res.status(500).json({ success: false });
    }
};



exports.removeFromCart = async (req,res) => {
    try {
        const productId = req.params.productId;
        const userId = req.session.user_id;

        const cart = await Cart.findOne({ userId });
        const cartItem = cart.items.find(item => item.productId.equals(productId));

        if (cartItem) {
            cart.totalQuantity -= cartItem.quantity;
            cart.totalPrice -= cartItem.price;
            cart.items = cart.items.filter(item => !item.productId.equals(productId));

            await cart.save();
        }

        res.redirect('/cart');
    } catch (error) {
        console.log(error.message)
        res.redirect('/cart');
    }
}