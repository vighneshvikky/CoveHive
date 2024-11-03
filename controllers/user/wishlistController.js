const Wishlist = require('../../models/wishlistSchema');
const Category = require('../../models/admin/categoryModel');
const Product = require('../../models/admin/productModel');

exports.getWishlist = async(req,res) =>{
    try {
     const categories = await Category.find({isBlocked:false});
     const userId = req.session.user_id
     
     let wishlist = await Wishlist.findOne({userId:userId})
     .populate({
        path:'products.productId',
        model:Product,
        select:'name price discount image stock'
     })

     if(!wishlist){
        wishlist = {products:[]}
     }

     res.render('user/wishlist',{
        wishlist
     })
     
    } catch (error) {
       console.log(`error from getWishlist ${error}`);
        
    }
}

exports.postWishlist = async(req,res) =>{
    try {
        const {productId} = req.body;
        const userId = req.session.user_id;

        if(!userId){
            return res.json({
              status:'error',
              message:'user not found please login'
      
            })
          }

          let wishlist = await Wishlist.findOne({userId});
          if(!wishlist){
            wishlist = new Wishlist({
                userId,
                products:[{productId}]
            })
          }else{
            const productExists = wishlist.products.some(
                (product) => product.productId.toString() === productId
            );
            console.log(`productExists = ${productExists}`)
            if(productExists){
                return res.json({
                    status: 'alreadyIn',
                    message: "Product is already in your wishlist",
                  });
            }
            // wishList.products.push({ productId });
            wishlist.products.push({productId})
          }

          await wishlist.save()
          return res.json({
            status: "success",
            message: "Product added to wishlist successfully",
          });
    } catch (error) {
       console.log(`error from postWishlist ${error}`);
       return res.status(500).json({
        status: "error",
        message: "Failed to add product to wishlist",
      });
        
    }
}

exports.removeWishlist= async(req,res) =>{
    try {
      const {productId} = req.body;
      const userId = req.session.user_id;

      let wishlist = await Wishlist.findOne({userId});
      if(wishlist){
        wishlist.products = wishlist.products.filter(
            (item) => item.productId.toString() !== productId
        )
        await wishlist.save();
        return res.status(200).json({status:'success',message:'Product removed from wishlist'})
      }else{
        res.status(404).json({ status: 'error', message: 'Wishlist not found' });
      }
    } catch (error) {
       console.log(`error from removeWishlist ${error}`);
       res.status(500).json({ status: 'error', message: 'Failed to remove product from wishlist' });
        
    }
}