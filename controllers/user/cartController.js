const User = require('../../models/user/userSchema');
const Cart = require('../../models/user/cartSchema');
const Product = require('../../models/admin/productModel');
const { HttpStatus } = require('../../enums/app.enums');




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
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Server error');
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
  
      const product = await Product.findById(productId);
      req.session.user_price = product.price;
      if (!product) {
          return res.send('Product not found');
      }

      
      if (product.stock <= 0) {
          req.flash('error_msg','Product is out of Stock');
          return res.redirect(`/products/${productId}`);
      }

    
      let cart = await Cart.findOne({ userId }).populate('items.productId');

    
      if (!cart) {
          cart = new Cart({ userId, items: [], payableAmount: 0, totalPrice: 0 });
      }


      let cartItem = cart.items.find(item => item.productId.equals(product._id));
      
      if (cartItem) {
        
          if (cartItem.productCount + 1 > product.stock || cartItem.productCount + 1 > MAX_QUANTITY_LIMIT) {
              res.locals.alertMessage = `Cannot add more than ${Math.min(product.stock, MAX_QUANTITY_LIMIT)} items to the cart.`;
              return res.redirect('/cart');
          } else {
              cartItem.productCount += 1; 
          }
      } else {
          
          cart.items.push({
              productId: product._id,
              productCount: 1,
              productPrice: product.price || 0, 
              productImage: product.image[0],
              productDiscountPrice: product.price 
              ? (product.discount ? product.price * (1 - (product.discount / 100)) : product.price) 
              : 0
          
          });
      }


    cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.productDiscountPrice,
        0
      );
const payableAmount  = cart.items.reduce((acc,item)=> acc+(item.productDiscountPrice * item.productCount),0)

      cart.payableAmount = payableAmount;
    

      await cart.save();

      return res.redirect('/cart');
  } catch (error) {
      console.error('Error adding to cart:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Server Error');
  }
};

exports.increment = async (req, res) => {
  try {
    
      const { productId } = req.body;
  
      const userId = req.session.user;
  
      const maxQuantity = 10;

      
      if (!userId || !productId) {
          return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid request' });
      }

      
      const product = await Product.findById(productId);
      if (!product) {
          return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Product not found' });
      }

      // Find the user's cart
      const cart = await Cart.findOne({ userId });
      if (!cart) {
          return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Cart not found' });
      }
      cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.productDiscountPrice,
        0
      );
      // Find the product in the cart
      const index = cart.items.findIndex(p => p.productId.toString() === productId);
      if (index === -1) {
          return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: 'Product not found in cart' });
      }

      // Check current product count
      const currentCount = cart.items[index].productCount;

      // Increment count
      const newCount = currentCount + 1;

      // Validate maximum quantity
      if (newCount > maxQuantity) {
          return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: `Maximum quantity per product is ${maxQuantity}` });
      }

      // Validate available stock
      if (newCount > product.stock) { // Changed from product.productCount to product.stock
          return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: `Available quantity of this product is ${product.stock}` });
      }

      // Update the product count in cart
      cart.items[index].productCount = newCount;
      cart.payableAmount =  cart.items.reduce((total, item) => total + (item.productDiscountPrice * item.productCount), 0);
     
      // Calculate the updated total price
      const updatedPrice = cart.items[index].productDiscountPrice * cart.items[index].productCount;

      // Save the cart
      await cart.save();

      // Send success response with updated cart information
      res.status(HttpStatus.OK).json({
          success: true,
          message: 'Product quantity updated successfully',
          updatedCart: cart,
          cartTotal: cart.items.reduce((total, item) => total + (item.productDiscountPrice * item.productCount), 0),
          updatedPrice: updatedPrice,
          productCount:newCount 
      });
  } catch (error) {
      console.error(`Error incrementing product quantity in cart: ${error}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
  }
};


// //------------- Decrement Function ---------------

exports.decrement = async (req, res) => {
  try {
      const userId = req.session.user;
      const { productId } = req.body;
      if (!userId || !productId) {
          return res.status(HttpStatus.BAD_REQUEST).send('Invalid request');
      }
      const cart = await Cart.findOne({ userId });
      if (!cart) {
          return res.status(HttpStatus.NOT_FOUND).send('Cart not found');
      }
      const index = cart.items.findIndex(p => p.productId.toString() === productId);

      if (index > -1) {
          cart.items[index].productCount -= 1;
          if (cart.items[index].productCount <= 0) {
              cart.items[index].productCount = 1;
          }
          cart.totalPrice = cart.items.reduce(
            (acc, item) => acc + item.productDiscountPrice,
            0
          );
          cart.payableAmount =  cart.items.reduce((total, item) => total + (item.productDiscountPrice * item.productCount), 0);
          await cart.save();
          res.status(HttpStatus.OK).json({
              success: true,
              cartTotal: cart.items.reduce((total, item) => total + (item.productDiscountPrice * item.productCount), 0),
              productCount:cart.items[index].productCount,
              updatedPrice: cart.items[index]?.productDiscountPrice * cart.items[index]?.productCount || 0});
              disableButton: cart.items[index]?.productCount === 1 
              productCount:cart.items[index].productCount;
      } else {
          res.status(HttpStatus.NOT_FOUND).send('Product not found in cart');
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
      cart.totalPrice = cart.items.reduce((total, item) => total + item.productDiscountPrice * item.productCount, 0);
      cart.payableAmount = cart.totalPrice;
      await cart.save(); // Save the updated cart
      res.redirect('/cart');
  } catch (error) {
      console.error('Error removing product from cart:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Server error');
  }
};