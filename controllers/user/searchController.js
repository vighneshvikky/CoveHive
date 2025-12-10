const e = require('connect-flash');
const Product = require('../../models/admin/productModel');
const User = require('../../models/user/userSchema')
const Category = require('../../models/admin/categoryModel')

exports.searchProducts = async (req, res) => {
    try {
        const { q, sort } = req.query;
        let searchQuery = {};
        let sortQuery = {};
        const user = await User.findById(req.session.user_id)
        if (q) {
            searchQuery = { name: { $regex: q, $options: 'i' } };
        }
        const categories = await Category.find({isBlocked:false});
      
        if (sort) {
            switch (sort) {
                case 'price_asc':
                    sortQuery = { price: 1 }; // Ascending price
                    break;
                case 'price_desc':
                    sortQuery = { price: -1 }; // Descending price
                    break;
                case 'rating_desc':
                    sortQuery = { rating: -1 }; // Top rated
                    break;
                case 'name_asc':
                    sortQuery = { name: 1 }; // Alphabetical A-Z
                    break;
                case 'name_desc':
                    sortQuery = { name: -1 }; // Alphabetical Z-A
                    break;
            }
        }

        const products = await Product.find(searchQuery).sort(sortQuery);

        res.render('user/allProducts', { products,user, searchQuery: q, selectedSort: sort,categories });
    } catch (error) {
        console.error('Error during search:', error.message);
        res.status(500).send('Error during search');
    }
};


exports.searchAndFilterProducts = async (req, res) => {
    try {
        const { q, sort, category } = req.query; // Get search, sort, and category from query parameters
        let searchQuery = {};
        let sortQuery = {};
        const user = await User.findById(req.session.user_id);

        // Create search query if there's a search term
        if (q) {
            searchQuery.name = { $regex: q, $options: 'i' }; // Case-insensitive search
        }

        // Create category filter if there's a selected category
        if (category) {
            searchQuery.category = category; // Filter by selected category
        }
       const categories = await Category.find({isBlocked:false});
        // Sort based on user's selection
        if (sort) {
            switch (sort) {
                case 'price_asc':
                    sortQuery.price = 1; // Ascending price
                    break;
                case 'price_desc':
                    sortQuery.price = -1; // Descending price
                    break;
                case 'rating_desc':
                    sortQuery.rating = -1; // Top rated
                    break;
                case 'name_asc':
                    sortQuery.name = 1; // Alphabetical A-Z
                    break;
                case 'name_desc':
                    sortQuery.name = -1; // Alphabetical Z-A
                    break;
                default:
                    break;
            }
        }

        // Find products with the combined search and filter queries
        const products = await Product.find({category:category});

        // Render the products view with the filtered and sorted products
        res.render('user/allProducts', { products, user, searchQuery: q, selectedSort: sort ,categories});
    } catch (error) {
        console.error('Error during search and filtering:', error.message);
        res.status(500).send('Error during search and filtering');
    }
};
