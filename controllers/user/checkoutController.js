const User = require('../../models/user/userSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/user/cartSchema');

exports.getCheckoutPage = async (req,res) => {
    try {
        if (!req.session.user) {
            req.flash('error', "User not found, please log in again");
            return res.redirect('/login');
        }
      const userId = req.session.user_id;
      const user = await User.findById(userId);

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
// exports.addAddress = async (req,res) => {
//     const {fullName,street,city,pincode,state,country} = req.body;
//     try {
//         const newAddress = new Address({
//             userId: req.session.user._id,
//             fullName,
//             street,
//             city,
//             pincode,
//             state,
//             country,
//             isDefault:false
            
//         })
      
//         await newAddress.save();
//         res.redirect('/checkout')
//     } catch (error) {
        
//     }
// }