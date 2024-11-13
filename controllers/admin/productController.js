const Product = require('../../models/admin/productModel');

const Category = require('../../models/admin/categoryModel');
const { default: mongoose } = require('mongoose');

exports.loadProduct = async(req,res) => {
    const page = parseInt(req.query.page) || 1;
    const limit =  8;
    try {
         const totalProduct = await Product.countDocuments();
        const productData = await Product.find({isAvailable:true}).populate('category')
        .skip((page-1)*limit)
        .limit(limit);  
              
        const categories = await Category.find();
        
       

   
        res.render('admin/adminProduct',{
          products:productData,
         categories,
         currentPage:page,
         totalPages:Math.ceil(totalProduct / limit),
      
        });
    } catch (error) {
     console.log(error.message);
        
    }
}
exports.addProduct = async(req,res) => {
    try {
      
      const categories = await Category.find();
       res.render('admin/addProduct',{
        categories
      }) 
    } catch (error) {
      console.log(error.message)  
    }
}
exports.postAddProduct = async(req,res) => {
    try { 
      //console.log(JSON.stringify(req.files, null, 2)+'hai')
        const images = req.files.map(file => file.filename);
        const { name, description, price, stock, category, subcategory, compatibleDevices, discount} = req.body;
        const priceAfterDiscount = (discount / 100) * 100;
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      category,
      subcategory,
      compatibleDevices,
      image:images,
      discount,
      priceAfterDiscount:priceAfterDiscount
    });

    //console.log(newProduct)

    await newProduct.save();
    } catch (error) {
      console.log(error.message);
        
    }
}
exports.blockUnblockProduct = async (req,res) => {
  try {
    
   const productId = req.params.id;
   const product = await Product.findById(productId);




   if(!product){
    req.flash('error_msg','Category not found');
    res.redirect('/admin/products')
   }
   product.isBlocked = !product.isBlocked;
   await product.save();
   const message = product.isBlocked ? 'Category blocked successfully':'Category unblocked successfully';
   req.flash('success_msg',message);
   res.redirect('/admin/products')
  

  } catch (error) {
   console.log(error.message);
    
  }
};

exports.loadEditProduct = async (req,res) =>{
  try {
    
     const product = await Product.findById(req.params.id).populate('category');
     //console.log(product)
     const categories = await Category.find();
     res.render('admin/editProduct',{
      product,
      categories
    })
  //  console.log(product.category.name);
    //console.log(product._id)
  } catch (error) {
    console.log(error.message);
    
  }
};

exports.removeImage = async(req,res) => {
  try {

    console.log('hiai')
   const {image, productId}= req.body
       // Find the product by ID
       const product = await Product.findById(req.params.id);

       // Remove the image from the product's image array
       product.image = product.image.filter(img => img !== image);
   
       // Save the updated product
       await product.save();
   
       // Optionally: delete the image file from the server
       const fs = require('fs');
       const path = `./uploads/${image}`;
       fs.unlink(path, (err) => {
         if (err) {
           console.error('Failed to delete image:', err);
         }
       });
   
       res.json({ success: true ,message:'Image removed sucessfully'});
  } catch (error) {
    console.log(`error from ${error}`)
  }
}

exports.postEditProduct = async (req,res) => {
 // const { name, description, price, category } = req.body;
  try {
//console.log(req.files+"hai")
    const productId = req.params.id; // Get product ID from the route
    //const imagePaths = req.files.map(file => file.filename);

    // Fetch the product
    let product = await Product.findById(productId)
 
    //console.log(req.files)
    if (!product) {
        return res.status(404).send('Product not found');
    }


      product.name = req.body.name||product.name;
      product.description = req.body.description||product.description;
      product.price = req.body.price||product.price;
      product.category =req.body.category||product.category;
      product.discount = req.body.discount;
      product.stock = req.body.stock;
      product.subcategory = req.body.subcategory||product.subcategory;
      product.compatibleDevices = req.body.compatibleDevices||product.compatibleDevices;

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => file.filename); // New uploaded images
        console.log(`newImages is ${newImages}`)
        product.image =  [...product.image,...newImages]// Append new images to the existing ones
      }


    await product.save();


    res.redirect('/admin/products');

   }catch (error) {
   console.log(error.message);
    
  }
};



exports.deleteProduct = async (req,res) => {
  try {
    const productId = req.params.id;
    const deleteProduct = await Product.findByIdAndDelete(productId);
    if(!deleteProduct){
      return res.status(404).send('Product not found'); 
    }

    res.redirect('/admin/products')
  } catch (error) {
    console.log(error.message)
  }
}


exports.loadProductDetails = async (req,res) => {
  const productId = req.params.id; // Get the product ID from the URL parameters
  try {
      const product = await Product.findById(productId); // Fetch the product by ID directly
      const relatedProducts = await Product.find({
        isBlocked:false,
        category:product.category,
        _id:{$ne:product._id}
      }).limit(4)
      if (!product) { 
          return res.status(404).send('Product not found'); // Handle case where product doesn't exist
      }
      const userName =  req.session.userName
      res.render('user/productDetails', {
         product,
         relatedProducts,
         currentRoute:'/home',
         userName 
        }); // Render the product details EJS template
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error'); // Handle server errors
  }
}