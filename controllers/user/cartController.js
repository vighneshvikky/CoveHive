const Product = require('../../models/admin/productModel');
const Cart = require('../../models/user/cartSchema');
const User = require('../../models/user/userSchema')
exports.addToCart = async (req, res) => {
    try {
        const { quantity } = req.body; // Get the quantity from request body
        const productId = req.params.productId;
        const userId = req.session.user_id; // Assuming the user is logged in and their ID is stored in the session
        console.log(`User ID is ${userId}`);

        // Fetch product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the product is in stock
        if (product.stock <= 0) {
            return res.status(400).json({ message: 'Product is out of stock.' });
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

        // Determine the quantity to add
        const qtyToAdd = quantity || 1;

        // If the item already exists in the cart, update the quantity
        if (cartItem) {
            const newQuantity = cartItem.quantity + qtyToAdd; // Increment by requested quantity

            // Check available stock
            const availableStock = product.stock + cartItem.quantity; // Total stock available including cart items
            if (newQuantity > availableStock) {
                return res.status(400).json({ message: 'Not enough stock available for this product.' });
            }

            // Update cart item quantity and price
            cartItem.quantity = newQuantity;
            cartItem.price = newQuantity * product.price;

            // Update totals for the cart
            cart.totalQuantity += qtyToAdd; // Increment total quantity
            cart.totalPrice += product.price * qtyToAdd; // Increment total price based on the new quantity
        } else {
            // If not in the cart, check if we can add it
            if (product.stock < qtyToAdd) {
                return res.status(400).json({ message: 'Not enough stock available for this product.' });
            }

            // Add the item to the cart
            cart.items.push({
                productId: product._id,
                quantity: qtyToAdd,
                price: product.price * qtyToAdd // Price for the item based on quantity
            });

            // Update totals
            cart.totalQuantity += qtyToAdd;
            cart.totalPrice += product.price * qtyToAdd;
        }

        // Decrease stock in the product collection after confirming the addition
        product.stock -= qtyToAdd;
        await product.save(); // Save the updated product stock

        // Save the cart
        await cart.save();
        res.status(200).json({
            success:true,
            message: 'Product added to cart Sucessfully!',
            cartItemCount: cart.totalQuantity // Return the total quantity in the cart
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Failed to add to cart!" });
    }
};






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

        // Check if the new quantity is valid (must be greater than 0)
        const newQuantity = parseInt(quantity, 10);
        if (newQuantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        // Calculate the change in quantity
        const quantityChange = newQuantity - cartItem.quantity;

        // Check if stock is sufficient
        if (quantityChange > product.stock) {
            return res.status(400).json({ success: false, message: 'Insufficient stock available' });
        }

        // Update the cart item
        cartItem.quantity = newQuantity;
        cartItem.price = newQuantity * product.price; // Update price based on new quantity

        // Update the total quantity and price for the cart
        cart.totalQuantity += quantityChange; // Update total quantity in cart
        cart.totalPrice += quantityChange * product.price; // Update total price in cart

        // Update product stock
        product.stock -= quantityChange; // Reduce stock based on the change in quantity

        // Prevent negative stock
        if (product.stock < 0) product.stock = 0; 

        // Save the updated product and cart
        await product.save();
        await cart.save();

        return res.json({ success: true, message: "Cart updated successfully." });

    } catch (error) {
        console.error('Error updating cart:', error.message);
        res.status(500).json({ success: false, message: "An error occurred while updating the cart." });
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