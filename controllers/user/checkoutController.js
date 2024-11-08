const User = require('../../models/user/userSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/user/cartSchema');
const Order = require('../../models/orderSchema');
const Product = require('../../models/admin/productModel');
const Coupon = require('../../models/couponSchema')
const Wallet = require('../../models/walletSchema')

const  Razorpay = require('razorpay');
const { concurrency } = require('sharp');
const orderSchema = require('../../models/orderSchema');
const Category = require('../../models/admin/categoryModel');

exports.validateCheckout = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'User not found, please log in again.' });
        }

        const userId = req.session.user_id;
        const cartDetails = await Cart.findOne({ userId }).populate('items.productId');

        if (!cartDetails) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        const items = cartDetails.items;
        if (items.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty.' });
        }

        for (const item of items) {
            const product = item.productId;
            if (!product.isAvailable) {
                return res.status(400).json({ success: false, message: `Product "${product.name}" is not available.` });
            }

            if (item.productCount > product.stock) {
                return res.status(400).json({ success: false, message: `The quantity of "${product.name}" exceeds the available stock.` });
            }
        }

        // If all checks pass
        res.status(200).json({ success: true, message: 'Validation successful' });
    } catch (error) {
        console.error('Error during checkout validation:', error);
        res.status(500).json({ success: false, message: 'Server Error. Please try again later.' });
    }
};

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
let wallet = await Wallet.findOne({ userID: userId });



if (!wallet) {
    wallet = { balance: 0, transaction: [] };
}


    const addresses = user.addresses;

    res.render('user/checkout',{
        user,
        cartDetails,
        userDetails:user,
        addresses,
        eligibleCoupons,
        wallet
    })


            
        } catch (error) {
            console.error('Error fetching addresses:', error);
            res.status(500).send('Server Error');
        }
    
}





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
    const addressIndex = parseInt(req.params.address);
    const paymentMode = parseInt(req.params.payment);
    let couponDiscount = 0 ;
   let paymentId = '';
   const { razorpay_payment_id, razorpay_order_id, razorpay_signature, payment_status , couponCode ,selectedAddress} = req.body;

   console.log(`payment status = ${payment_status}`)

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
 
let discountPrice = cartItems.totalPrice - cartItems.payableAmount;




if (!cartItems || !cartItems.items || cartItems.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty or could not be found.' });
}

const paymentDetails = ["Cash on delivery", "Wallet", "razorpay"];

const products = [];
let totalPrices = cartItems.payableAmount;
let totalQuantity = 0;
const user = await User.findById(req.session.user_id).populate('addresses')
if (!user || !user.addresses|| !user.addresses[addressIndex]) {
    return res.status(400).json({ success: false, message: 'Selected address is not valid.' });
}
 console.log(`user address = ${user.addresses[addressIndex].fullName}`)
const newOrder = new Order({
     userId: req.session.user,
    orderId: Math.floor(Math.random() * 1000000),
    items: cartItems.items,
    totalQuantity: totalQuantity,
    totalPrice: totalPrices,    
    couponCode : couponCode,
    couponDiscount: discountPrice,
    address:{
        contactName:user.addresses[addressIndex].fullName,
        street:user.addresses[addressIndex].street,
        city:user.addresses[addressIndex].city,
        pincode:user.addresses[addressIndex].pincode,
        state:user.addresses[addressIndex].state,
        country:user.addresses[addressIndex].country
    },
    
    // productDiscountPrice:val,
    
    paymentMethod: paymentDetails[paymentMode],
    orderStatus: payment_status === "Pending" ? "Pending" : "Paid",
    paymentId: paymentId,
    paymentStatus: payment_status,
    isCancelled: false
});
await newOrder.save();
//  console.log(`newOrder = ${newOrder}`)

if(paymentDetails[paymentMode] === 'Wallet'){
    const wallet = await Wallet.findOne({ userID: userId });
    if (!wallet || wallet.balance < cartItems.payableAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance.' });
    }
    wallet.balance -= cartItems.payableAmount;
    wallet.transaction.push({
        wallet_amount: cartItems.payableAmount,
        transactionType: 'Debited',
        transaction_date: new Date(),
        order_id: newOrder.order_id,
    });
await wallet.save();
}

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


    const couponUsage = user.couponUsed.find((usage) =>{
        return usage.couponId.toString() === coupon._id.toString();
    })

       console.log(`this is the applied coupon ${couponUsage}`);


       if(couponUsage && couponUsage.usageCount >= coupon.usageCount){
        console.log('hai')
        return res.status(400).json({
            status:'error',
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