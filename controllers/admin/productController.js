const Product = require('../../models/admin/productModel');

const Category = require('../../models/admin/categoryModel');
const { default: mongoose } = require('mongoose');

exports.loadProduct = async(req,res) => {
    try {
        const productData = await Product.find({isAvailable:true}).populate('category')
        const categories = await Category.find();

        res.render('admin/adminProduct',{
          products:productData,
         categories
        })
    } catch (error) {
     console.log(error.message);
        
    }
}
exports.addProduct = async(req,res) => {
    try {
      const categories = await Category.find();
       res.render('admin/addProduct',{categories}) 
    } catch (error) {
      console.log(error.message)  
    }
}
exports.postAddProduct = async(req,res) => {
    try { 
      console.log(JSON.stringify(req.files, null, 2)+'hai')
        const images = req.files.map(file => file.filename);
        const { name, description, price, stock, category, subcategory, compatibleDevices } = req.body;
    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      category,
      subcategory,
      compatibleDevices,
      image:images  
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully' });
    //console.log(newProduct) 
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

exports.postEditProduct = async (req,res) => {
 // const { name, description, price, category } = req.body;
  try {
console.log(req.files+"hai")
    const productId = req.params.id; // Get product ID from the route
    const imagePaths = req.files.map(file => file.filename);

    // Fetch the product
    let product = await Product.findById(productId)
 
    //console.log(req.files)
    if (!product) {
        return res.status(404).send('Product not found');
    }


      product.name = req.body.name;
      product.description = req.body.description;
      product.price = req.body.price;
      product.category =req.body.category;
      product.image = imagePaths;

    //console.log(product.category.name)
  
    // if (req.files && req.files.length > 0) {
    //     const imagePaths = req.files.map(file => file.filename); // Get filenames from uploaded images
    //     product.image = imagePaths; // Overwrite the existing images with the new ones
    // }

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