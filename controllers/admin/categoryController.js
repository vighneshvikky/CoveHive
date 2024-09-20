const Category = require('../../models/admin/categoryModel');

// List all categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false }); // Fetch non-deleted categories
    res.render('admin/categoryList', { categories });
  } catch (error) {
    res.status(500).send('Server Error');
  } 
};

// Show add category form
exports.addCategoryForm = (req, res) => {
  res.render('admin/addCategory');
};

// Add a new category
// exports.addCategory = async (req, res) => {
//   try {
//     const newCategory = new Category({
//       name: req.body.name,
//       description: req.body.description
//     });
//     await newCategory.save();
//     res.redirect('/admin/categories');
//   } catch (error) {
//     res.status(500).send('Server Error');
//   }
// };
exports.addCategory = async (req, res) => {
    try {
      console.log(req.body);  // Check if the form data is coming through
      const newCategory = new Category({
        name: req.body.name,
        description: req.body.description
      });
      await newCategory.save();
      res.redirect('/admin/categories');
    } catch (error) {
      console.error(error);  // Log the error to see the details
      res.status(500).send('Server Error');
    }
  };
  

// Show edit category form
exports.editCategoryForm = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    console.log(category);
    res.render('admin/editCategory', { category });
  } catch (error) {
    res.status(500).send('Server Error');  
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      description: req.body.description
    });
    res.redirect('/admin/categories');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};

// Soft delete a category
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.redirect('/admin/categories');
  } catch (error) {
    res.status(500).send('Server Error');
  }
};
