const Category = require('../../models/admin/categoryModel');


exports.loadCategories = async (req,res) => {
  const page = parseInt(req.query.page)||1;
  const limit = 10;
  const skip = (page - 1) * limit; //skip for pagination
  try {
    const categories = await Category.find().skip(skip).limit(limit);
    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories/limit)
    res.render('admin/addCategory',{
      categories,
      currentPage:page,
      totalPages : totalPages
      
    });
  } catch (error) {
    console.log(error.message);
    
  }
}


exports.insertCategories = async (req,res) => {
  try {


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

//--------------edit category

exports.editCategory  = async (req,res) => {
  try {
    const category = await Category.findById(req.params.id);
    res.render('admin/editCategory', { category }); 
  } catch (error) {
    console.log(error.message);
    
  }
}

//--------------update category

exports.updateCategory = async (req,res) => {
  try {
    const { name } = req.body;
    let updateData = { name };

    // If a new image is uploaded, include it in the update
    if (req.file) {
        updateData.img = req.file.filename;
    }

    await Category.findByIdAndUpdate(req.params.id, updateData); // Update the category
    res.redirect('/admin/categories');
  } catch (error) {
   console.log(error.message);
    
  }
}