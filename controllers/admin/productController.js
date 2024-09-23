const Product = require('../../models/admin/productModel');

const categorySchema = require('../../models/admin/categoryModel');

exports.loadProduct = async(req,res) => {
    try {
        const productData = await Product.find({isBlocked:false})
        res.render('admin/adminProduct',{products:productData})
    } catch (error) {
     console.log(error.message);
        
    }
}
exports.addProduct = async(req,res) => {
    try {
       res.render('admin/addProduct') 
    } catch (error) {
      console.log(error.message)  
    }
}
exports.postAddProduct = async(req,res) => {
    try {

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
    console.log(newProduct) 
    } catch (error) {
      console.log(error.message);
        
    }
}