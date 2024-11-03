const User = require('../../models/user/userSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/user/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel');
const Coupon = require('../../models/couponSchema')

const  Razorpay = require('razorpay');
const { concurrency } = require('sharp');
const orderSchema = require('../../models/orderSchema');
const Category = require('../../models/admin/categoryModel');

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
const availableCoupons = await Coupon.find({
    isActive:true,
    endDate:{$gte:new Date()},
    minimumOrderAmount:{$lte:cartDetails.totalPrice}
});

const eligibleCoupons = availableCoupons.filter((coupon) =>{
   const couponUsage =  user.couponUsed.find((c) =>{
    c.couponId.equals(coupon._id)
   })
   if(couponUsage){
    return couponUsage.usageCount < coupon.usageCount
   }
   return true
});

    const addresses = user.addresses;

    res.render('user/checkout',{
        user,
        cartDetails,
        userDetails:user,
        addresses,
        eligibleCoupons
    })


            
        } catch (error) {
            console.error('Error fetching addresses:', error);
            res.status(500).send('Server Error');
        }
    
}


// exports.placeOrder = async (req,res) => {
//     try {
//         const userId = req.session.user_id;
//         const {selectedAddress,paymentMethod} = req.body;
//         console.log(`data from form = ${req.body}`);
//         if (!selectedAddress || !paymentMethod) {
//             return res.status(400).send('Invalid address or payment method');
//         }
//         const cart = await Cart.findOne({userId});
//         if(!cart||cart.items.length === 0){
//             return res.status(400).json({ message: 'Your cart is empty' });  
//         }
//         console.log(`cart = ${cart}`);
//         const user = await User.findById(userId).populate('addresses');
//         const address = user.addresses.find(addr => addr._id.toString() === selectedAddress);
//         if (!address) {
//             return res.status(400).send('Address not found');
//         }
//       const newOrder = new Order({
//         userId:userId,
//         items: cart.items,
//         totalPrice: cart.totalPrice,
//         address: `${address.fullName}, ${address.street}, ${address.city}, ${address.state}, ${address.country}, ${address.pincode}`,
//         paymentMethod: paymentMethod,
//         status: 'Pending'
//       })

//       const orders = await newOrder.save();

//       for(let item of cart.items){
//         const product = await Product.findById(item.productId);
//         if (product) {
//             product.stock -= item.productCount; // Reduce the stock by the ordered quantity
//             await product.save(); // Save the updated product stock
//         }
//       }
   
//       cart.items = [];
//       cart.totalPrice = 0;
//       cart.payableAmount = 0;
//       await cart.save();

//       res.render('user/conform-order',{
//        orders
//       })
      

//     } catch (error) {
//        console.log(`error from placeOrder = ${error}`) 
//     }
// }



exports.orderConformPage = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const user = await User.findById(userId);

        const orders = await Order.findOne({ userId: user._id }).sort({createdAt : -1}).limit(1)

        res.render('user/conform-order', { orders:orders });
    } catch (err) {
        console.log(`Error on render in conform order ${err}`);
    }
}

exports.paymentRender = async (req,res) =>{
    try {
        console.log(`hai from paymentRender`);
        
        const totalAmount = req.params.amount;
        if(!totalAmount){
            return res.status(404).json({error:'Amount parameter is missing'});
        }

        const instance = new Razorpay({
            key_id:process.env.RAZORPAY_KEY_ID,
            key_secret:process.env.RAZORPAY_SECRET
        });

        const options = {
            amount:totalAmount*100,
            currency:'INR',
            receipt: "receipt#1"
        }

        instance.orders.create(options, (error, order) => {
            if (error) {
                console.error(`Failed to create order: ${error}`);
                return res.status(500).json({ error: `Failed to create order: ${error.message}` });
            }
            return res.status(200).json({ orderID: order.id });
        });

    } catch (error) {
        console.error(`Error on orders in checkout: ${error}`);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


exports.placeOrder = async (req,res) =>{
    console.log('hai from placeOrder')
try {
    const userId = req.session.user_id;
    //const addressIndex = parseInt(req.params.address);
    const paymentMode = parseInt(req.params.payment);
    let couponDiscount = 0 ;
   let paymentId = '';
   const { razorpay_payment_id, razorpay_order_id, razorpay_signature, payment_status , couponCode } = req.body;
   if(couponCode){
    const coupon = await Coupon.findOne({couponCode:couponCode });
    if (coupon && coupon.isActive) {
        couponDiscount = coupon.discountValue;
    }
   }

   if (paymentMode === 2) {
    paymentId = razorpay_payment_id;
}

const cartItems = await Cart.findOne({userId}).populate('items.productId');
 



if (!cartItems || !cartItems.items || cartItems.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty or could not be found.' });
}

const paymentDetails = ["Cash on delivery", "Wallet", "razorpay"];
// if(paymentDetails[paymentMode] === 'Cash on delivery'){
//     if(cartItems.payableAmount > 1000){
//         return res.status(400).json({ success: false, message: 'COD below 1000 only.' });
//     }
// }
const products = [];
let totalPrices = cartItems.payableAmount;
let totalQuantity = 0;
// cartItems.items.forEach((item) => {
//     products.push({
//         productId: item.productId._id,
//         productName: item.productId.productName,
//         productCategory: item.productId.productCollection,
//         productCount: item.productCount,
//         productPrice: item.productId.productPrice,
//         productDiscount:item.productId.productDiscount,
//         productImage: item.productId.productImage[0],
//         productStatus: 'Pending'
//     });
//     totalQuantity += item.productCount;
// });


const newOrder = new Order({
    userId: req.session.user,
    orderId: Math.floor(Math.random() * 1000000),
    items: cartItems.items,
    totalQuantity: totalQuantity,
    totalPrice: totalPrices,    
    couponCode : couponCode,
    couponDiscount: couponDiscount,
    // productDiscountPrice:val,
    paymentMethod: paymentDetails[paymentMode],
    orderStatus: payment_status === "Pending" ? "Pending" : "Confirmed",
    paymentId: paymentId,
    paymentStatus: payment_status,
    isCancelled: false
});
await newOrder.save();
 console.log(`newOrder = ${newOrder}`)

 for(let item of cartItems.items){
             const product = await Product.findById(item.productId);
             if (product) {
            product.stock -= item.productCount; // Reduce the stock by the ordered quantity
    await product.save(); // Save the updated product stock
            }
         }

await Cart.deleteOne({ userId: req.session.user_id });
return res.status(200).json({ success: true, message: 'Order placed successfully!' });


} catch (error) {
    console.log(`error from ${error}`);
    
}
}


exports.applyCoupon = async (req,res) =>{
    try {
        const {couponCode} = req.body;
        const user = await User.findOne({_id:req.session.user_id});
        if (!user) {
            return res.redirect("/login");
          }

          const coupon = await Coupon.findById(couponCode);
          
          if (!coupon) {
            return res.status(400).json({
              status: "error",
              message: "Coupon not found",
            });
          }

          if(!coupon.isActive){
            return res.status(400).json({
                status:'error',
                message:'Coupon not active'
            });
          }
       console.log(`coupon endDate = ${coupon.endDate}`);

       if(!coupon.endDate > new Date()){
        return res.status(400).json({
            status:'error',
            message:'Coupon expired'
        })
       }
       console.log(`couponId = ${coupon._id}`)
       const couponUsage = user.couponUsed.find((usage) => {
        return usage.couponId.toString() === coupon._id.toString();
       });

       console.log(`this is the applied coupon ${couponUsage}`);

       if(couponUsage && couponUsage.usageCount >= coupon.usageCount){
        return res.status(400).json({
            status:error,
            message:"You've hit the limit for coupon usage."
        })
       }
       
       const cart = await Cart.findOne({userId:user._id});

       if(!cart){
        return res
        .status(404)
        .json({status:'error',message:'Cart not found'})
       }
       const total = cart.payableAmount;
       let discountedTotal = total;

       if(total < coupon.minimumOrderAmount){
        return res.status(409).json({
            status:'error',
            message:"Your order does not meet the minimum purchase requirement. Please add more items to your cart to proceed."
        })
       }
       let couponDiscount = coupon.discountValue;

       if(coupon.discountType === "Fixed"){
        discountedTotal = total - couponDiscount
       }else if(coupon.discountType === 'Percentage'){
        const discountAmount = (couponDiscount / 100) * total;
        couponDiscount = discountAmount;
        discountedTotal = total - discountAmount;
       }

       cart.payableAmount = discountedTotal;
       cart.isCouponApplied = true;
       cart.couponDiscount = couponDiscount;
       cart.couponId = couponCode
       console.log(`cart = ${cart   }`)
       await cart.save();
       console.log(`coupon usage = ${couponUsage}`);

       if(couponUsage){
        couponUsage.usageCount += 1;
       }else{
        user.couponUsed.push({
            couponId:couponCode,
            usageCount:1
        })
       }

       await user.save();

       return res
       .status(200)
       .json({status:'success',message:'Coupon applied',total:discountedTotal,couponDiscount});


    } catch (error) {
        console.log(`error from applyCoupon ${error}`);
      return res.status(500)
      .json({ error: "An error occurred while applying the coupon." });
    }
}

exports.removeCoupon = async (req,res) =>{
    try {
const user = await User.findOne({_id:req.session.user_id})
    if (!user) {
        return res.redirect("/login");
      }

const cart = await Cart.findOne({userId:req.session.user_id});
if (!cart) {
    return res
      .status(404)
      .json({ status: "error", message: "Cart not found" });
  }
  if (!cart.isCouponApplied) {
    return res.status(400).json({
      status: "error",
      message: "No coupon is applied to the cart.",
    });
  }

  let appliedCouponId = cart.couponId;
  let couponUsage = user.couponUsed.find((usage) => {
    return usage.couponId.toString() === appliedCouponId.toString();
  })

  if(couponUsage){
    if(couponUsage.usageCount > 0){
        couponUsage.usageCount -= 1;
    }
  }
// Remove the coupon discount from the cart and recalculate the total
  const total = cart.payableAmount + cart.couponDiscount;
  cart.payableAmount = total;
  cart.isCouponApplied = false;// Coupon no longer applied
  cart.couponDiscount = 0 ; // Reset the coupon discount
  appliedCouponId = null;

  await cart.save();
  await user.save();

  return res.status(200).json({
    status: "success",
    message: "Coupon removed successfully",
    total: cart.payableAmount,
  });

    } catch (error) {
       console.log(`error from removeCoupon ${removeCoupon}`);
       return res.status(500).json({
        error: "An error occurred while removing the coupon.",
      });
        
    }
}

exports.userCoupons = async (req,res) =>{
    try {
        const categories = await Category.find({isBlocked:false});
        const coupons = await Coupon.find({isActive:true});

        console.log(coupons);

        res.render('user/coupons',{
            categories,
            coupons:coupons
        })
    } catch (error) {
        console.log(`error from userCoupons ${error}`)
        return res.status(500).json({
            error:'An error occured while loading1 the coupon page.'
        })
    }
}