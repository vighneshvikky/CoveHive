const Category = require('../../models/admin/categoryModel');


exports.loadCategories = async (req,res) => {
 const page = parseInt(req.query.page)||1;
 const limit = parseInt(req.query.limit)||10
  try {
    const totalCategories = await Category.countDocuments();
    const categories = await Category.find()
    .skip((page-1)*limit)
    .limit(limit)
    res.render('admin/addCategory',{
      categories,
      currentPage:page,
      totalPages : Math.ceil(totalCategories / limit)
      
    });
  } catch (error) {
    console.log(error.message);
    
  }
}


// exports.insertCategories = async (req,res) => { 
//   try {


//     const newCategory = new Category({
//         name: req.body.name,
//         img: req.file.filename,
//     });
//    console.log(newCategory)
//     await newCategory.save();
//     res.redirect('/admin/categories');
//   } catch (error) {
//     console.log(error.message);
    
//   }
// }
exports.insertCategories = async (req, res) => { 
  try {
    // Ensure a file is uploaded
    if (!req.file) {
      throw new Error('Image file is required.');
    }

    const newCategory = new Category({
      name: req.body.name,
      img: req.file.filename,
    });
    
    
    await newCategory.save();
    res.redirect('/admin/categories');
  } catch (error) {
    console.log(error.message);
    res.status(500).send(error.message); // Handle error response
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
    console.log(updateData)

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



//------------------blockunblock category-------

exports.blockUnblockCategory = async (req,res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    
    if(!category){
      req.flash('error_msg','Category not found');
      res.redirect('/admin/categories')
    }

    category.isBlocked = !category.isBlocked;
    await category.save();
    const message = category.isBlocked ? 'Category blocked successfully':'Category unblocked successfully';
    req.flash('success_msg',message);
    res.redirect('/admin/categories')
  } catch (error) {
    console.log(error.message);

  }
}