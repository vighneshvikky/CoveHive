const Category = require('../../models/admin/categoryModel');


exports.loadCategories = async (req,res) => {
 const page = parseInt(req.query.page)||1;
 const limit = 3
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
  
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required.' }); 
    }

    
    const exist = await Category.findOne({ name: req.body.name });
    if (exist) {
      console.log(`exist = ${exist}`);
      req.flash('error_msg', 'Category name should be unique.');
      return res.redirect('/admin/categories'); 
    }

    
    const newCategory = new Category({
      name: req.body.name,
      img: req.file.filename,
    });
    console.log(`categoryName = ${req.body.name}, image = ${req.file.filename}`)
    await newCategory.save();

    
    req.flash('success_msg', 'Category added successfully.');
    res.redirect('/admin/categories');
  
  } catch (error) {
    console.error('Error adding category:', error); 
    res.status(500).json({ error: error.message }); 
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
    // console.log(`updateData = ${updateData}`)

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