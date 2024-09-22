const product = require('../../models/admin/productModel');


exports.addProduct = async (req,res) => {
    try {

        const{name,description,price,stock,category} = req.body;
        const images = req.files.map(file=> file.filename);

        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            images
        });

        await product.save();
        res.redirect('/admin/products');
        
    } catch (error) {
        console.log(error.message)
    }
};

exports.listProducts = async (req,res) => {
    try {
        const products = await Product.find({isDeleted:false}).populate('category');
        res.render('admin/admimProduct',{products});
    } catch (error) {
        console.log(error.message)
    }
};

exportss.editProduct = async (req,res) => {
  try {
    
   const {id} = req.params;
   const {name,description,price,stock,category} = req.body;

   const product = await Product.findById(id);
   if(!product) return res.status(404).send('Product not found');

   product.name = name;
   product.description = description;
   product.price = price;
   product.stock = stock;
   product.category = category;
   
   if(req.files.length > 0){
    product.images = req.files.map(file => file.filename);
   }

   await product.save();
   res.redirect('/admin/products');

  } catch (error) {
    console.log(error.message);
    
  }
}