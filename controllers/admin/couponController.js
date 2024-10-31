const Category = require('../../models/admin/categoryModel');
const Coupon = require('../../models/couponSchema');

exports.getCoupon = async(req,res) =>{
    try {
        const allCoupons = await Coupon.find();
   res.render('admin/coupons',{
    coupons:allCoupons
   })      
    } catch (error) {
       console.log(`error from getCoupon ${error}`);
        
    }
}

exports.addCoupon = async(req,res) =>{
    try {
        const categories = await Category.find({isBlocked:false});
        res.render('admin/addCoupon',{
            categories
        })
    } catch (error) {
        console.log(`error from ${error}`);
        
    }
}

exports.postAddCoupon = async (req,res) =>{
    try {
        console.log(`Adding coupons`);
        const {couponCode , minAmount,discountValue, discountType, startDate, expiryDate, usageCount} = req.body;
        console.log(`data from the body = ${req.body}`);

        const existCouponCode = await Coupon.findOne({couponCode:couponCode});
        
        if(existCouponCode){
            return res.status(400).json({
                status:'alreadyFound',
                message:`Couon code already exists :${couponCode}`
            })
        }
        
        const newCoupon = new Coupon ({
            couponCode,
            discountType,
            discountValue,
            minimumOrderAmount:minAmount,
            startDate,
            endDate:expiryDate,
            usageCount
        })
        
       console.log(`new coupon = ${newCoupon}`);
       

        await newCoupon.save();

        return res.status(200).json({
            status:'success',
            message:'Coupon created sucessfully'
        })
        
    } catch (error) {
        console.log(`error from ${error}`);
        return res.status(500).json({
            status:'error',
            message:'Coupon not found'
        })
        
    }
}

exports.removeCoupon = async (req,res) =>{
    try {
        const {couponId} = req.params;
        console.log(`couponID = ${couponId}`);
        
        const coupon = await Coupon.findById(couponId);
        if(!coupon){
            return res.status(404).json({status:'error',message:'Coupon not found'});
        }
        coupon.isActive=!coupon.isActive;
        await coupon.save();
        console.log(`coupon after removing ${coupon}`);
        
        res.status(200).json({
            status:'success',
            message:'Coupon updated'
        })
    } catch (error) {
        console.log(`error from removeCoupon ${error}`);
        res.status(500).json({status:'error',message:`Server error, ${error}`})
        
    }
}

exports.editCoupon = async(req,res) =>{
    try {
        const couponId = req.query.id;
        console.log(couponId);
        
        const coupon = await Coupon.findById(couponId);

        if(!coupon){
            return res.status(404).json({status:'error',message:'Coupon not found'});
        }

        res.render('admin/editCoupon',{
            coupon
        })

    } catch (error) {
        console.log(`error from editCoupon ${error}`);
         return res.status(500).json({status:'error',message:'server error'})
    }
}

exports.editCouponPost = async(req,res) =>{
    try {
       const {couponCode, minAmount, discountValue, discountType, startDate, expiryDate, usageCount, coupon_id} = req.body;
       
       console.log(`data from the FE = ${req.body}`)

      const couponEdit = await Coupon.findById(coupon_id);

      if(!couponEdit){
        return res.status(404).json({status:'error',message:'coupon not found'})
      }
       
      couponEdit.set({
        couponCode,
        discountType,
        discountValue,
        minimumOrderAmount:minAmount,
        startDate:startDate,
        endDate:expiryDate,
        usageCount
      })

     await couponEdit.save();
     

     return res.status(200).json({
        status:'success',
        message:'Coupon updated sucessfully'
     })

    } catch (error) {
        console.log(`error from editCouponPost ${error}`);
        return res.status(500).json({status:'error',message:'server error'})
    }
}