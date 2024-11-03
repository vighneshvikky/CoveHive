const User = require('../../models/user/userSchema');
const Cart = require('../../models/user/cartSchema');
const Product = require('../../models/admin/productModel');




exports.getCart = async (req, res) => {
const userId = req.session.user_id;
if(!userId){
  return res.render('user/UserLogin',{alertMessage:'User not logged in'});
}
try {
 
  const cart = await Cart.findOne({userId}).populate('items.productId');
  
  res.render('user/userCart',{cart,currentRoute:'/home'})
} catch (error) {
  console.error('Error fetching cart:', error.message);
  req.flash('error', 'Error fetching cart');
  res.status(500).send('Server error');
}
};

// Add to Cart
exports.addToCart = async (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
      return res.send('User not found!');
  }

  const productId = req.params.id;
  const MAX_QUANTITY_LIMIT = 10;

  try {
      // Fetch the product by ID
      const product = await Product.findById(productId);
      req.session.user_price = product.price;
      if (!product) {
          return res.send('Product not found');
      }

      // Check if the product is in stock
      if (product.stock <= 0) {
          req.flash('error_msg','Product is out of Stock');
          return res.redirect(`/products/${productId}`);
      }

      // Fetch the user's cart
      let cart = await Cart.findOne({ userId }).populate('items.productId');

      // If the cart doesn't exist, create a new one
      if (!cart) {
          cart = new Cart({ userId, items: [], payableAmount: 0, totalPrice: 0 });
      }

      // Log the product information
      console.log('Adding item to cart:', {
          productId: product._id,
          productCount: 1,
          productPrice: product.price, // Use product.price to get the actual price
          productImage: product.image[0]
      });

      // Check if the item already exists in the cart
      let cartItem = cart.items.find(item => item.productId.equals(product._id));
      
      if (cartItem) {
          // Check quantity limits
          if (cartItem.productCount + 1 > product.stock || cartItem.productCount + 1 > MAX_QUANTITY_LIMIT) {
              res.locals.alertMessage = `Cannot add more than ${Math.min(product.stock, MAX_QUANTITY_LIMIT)} items to the cart.`;
              return res.redirect('/cart');
          } else {
              cartItem.productCount += 1; // Increment the count
          }
      } else {
          // Add new item to the cart
          cart.items.push({
              productId: product._id,
              productCount: 1,
              productPrice: product.price || 0, // Fallback to 0 if product.price is undefined
              productImage: product.image[0],
              productDiscountPrice: product.price 
              ? (product.discount ? product.price * (1 - (product.discount / 100)) : product.price) 
              : 0
          
          });
      }

      // Calculate total prices
    //   cart.totalPrice = cart.items.reduce((total, item) => {
    //       const itemTotalPrice = item.productCount * (item.productPrice || 0); // Fallback to 0 if productPrice is undefined
    //       return total + itemTotalPrice;
    //   }, 0);
    cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.productPrice,
        0
      );
cart.totalPrice = cart.items.reduce((acc,item)=> acc+item.productDiscountPrice,0)
      // Calculate payable amount if necessary
      cart.payableAmount = cart.totalPrice;
    
      // Log the cart before saving
      console.log('Cart before saving:', JSON.stringify(cart, null, 2));
    //   req.session.cart = cart
      // Save the cart
      await cart.save();

      return res.redirect('/cart');
  } catch (error) {
      console.error('Error adding to cart:', error.message);
      return res.status(500).send('Server Error');
  }
};

exports.increment = async (req, res) => {
  try {
      console.log("Increment function called");
      const { productId } = req.body;
      console.log("Request Body: ", req.body);
      const userId = req.session.user;
      console.log("User ID: ", userId);
      const maxQuantity = 10;

      // Validate request
      if (!userId || !productId) {
          return res.status(400).json({ success: false, message: 'Invalid request' });
      }

      // Find the product
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Find the user's cart
      const cart = await Cart.findOne({ userId });
      if (!cart) {
          return res.status(404).json({ success: false, message: 'Cart not found' });
      }

      // Find the product in the cart
      const index = cart.items.findIndex(p => p.productId.toString() === productId);
      if (index === -1) {
          return res.status(404).json({ success: false, message: 'Product not found in cart' });
      }

      // Check current product count
      const currentCount = cart.items[index].productCount;

      // Increment count
      const newCount = currentCount + 1;

      // Validate maximum quantity
      if (newCount > maxQuantity) {
          return res.status(400).json({ success: false, message: `Maximum quantity per product is ${maxQuantity}` });
      }

      // Validate available stock
      if (newCount > product.stock) { // Changed from product.productCount to product.stock
          return res.status(400).json({ success: false, message: `Available quantity of this product is ${product.stock}` });
      }

      // Update the product count in cart
      cart.items[index].productCount = newCount;
      cart.payableAmount =  cart.items.reduce((total, item) => total + (item.productDiscountPrice * item.productCount), 0);
      console.log(`payableAmout = ${cart.payableAmount}`)
      // Calculate the updated total price
      const updatedPrice = cart.items[index].productDiscountPrice * cart.items[index].productCount;

      // Save the cart
      await cart.save();

      // Send success response with updated cart information
      res.status(200).json({
          success: true,
          message: 'Product quantity updated successfully',
          updatedCart: cart,
          cartTotal: cart.items.reduce((total, item) => total + (item.productDiscountPrice * item.productCount), 0),
          updatedPrice: updatedPrice,
          productCount:newCount 
      });
  } catch (error) {
      console.error(`Error incrementing product quantity in cart: ${error}`);
      res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// //------------- Decrement Function ---------------

exports.decrement = async (req, res) => {
  try {
      const userId = req.session.user;
      const { productId } = req.body;
      if (!userId || !productId) {
          return res.status(400).send('Invalid request');
      }
      const cart = await Cart.findOne({ userId });
      if (!cart) {
          return res.status(404).send('Cart not found');
      }
      const index = cart.items.findIndex(p => p.productId.toString() === productId);

      if (index > -1) {
          cart.items[index].productCount -= 1;
          if (cart.items[index].productCount <= 0) {
              cart.items[index].productCount = 1;
          }
          await cart.save();
          res.status(200).json({
              success: true,
              cartTotal: cart.items.reduce((total, item) => total + (item.productDiscountPrice * item.productCount), 0),
              productCount:cart.items[index].productCount,
              updatedPrice: cart.items[index]?.productDiscountPrice * cart.items[index]?.productCount || 0});
              disableButton: cart.items[index]?.productCount === 1 // Disable button when count is 1
              productCount:cart.items[index].productCount;
      } else {
          res.status(404).send('Product not found in cart');
      }
  } catch (error) {
      console.error(`Error decrementing product quantity in cart: ${error}`);
      showError(`Error decrementing product quantity in cart: ${error}`);
      res.status(500).send('Internal server error');
  }
};


// Update Cart Item Quantity
exports.updateCart = async (req, res) => {
  
};

// Delete Cart Item
exports.removeFromCart = async (req, res) => {
  const productId = req.params.id;
  const userId = req.session.user; // Assuming user session contains userId

  try {
      const cart = await Cart.findOne({ userId });
      if (!cart) {
          return res.redirect('/cart');
      }

      // Filter out the product to remove it from the cart
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
     
      // Update total price and payable amount
      cart.totalPrice = cart.items.reduce((total, item) => total + item.productCount * item.productPrice, 0);
      cart.payableAmount = cart.totalPrice;
      await cart.save(); // Save the updated cart
      res.redirect('/cart');
  } catch (error) {
      console.error('Error removing product from cart:', error);
      res.status(500).send('Server error');
  }
};