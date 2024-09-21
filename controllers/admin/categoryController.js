const Category = require('../../models/admin/categoryModel');


exports.loadCategories = async (req,res) => {
  try {
    res.render('admin/addCategory')
  } catch (error) {
    console.log(error.message);
    
  }
}


exports.insertCategories = async (req,res) => {
  try {
    // const { name } = req.body;
    // const imagePath = req.file.path;

    const newCategory = new Category({
        name: req.body.name,
        img: req.file.filename,
    });

    await newCategory.save();
    res.redirect('/admin/categories');
  } catch (error) {
    console.log(error.message);
    
  }
}
