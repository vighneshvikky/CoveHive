const Product = require('../../models/admin/productModel');
const User = require('../../models/user/userSchema')
exports.searchProducts = async (req, res) => {
    try {
        const { q, sort } = req.query;
        let searchQuery = {};
        let sortQuery = {};
        const user = await User.findById(req.session.user_id)
        if (q) {
            searchQuery = { name: { $regex: q, $options: 'i' } };
        }

        // Sort based on user's selection
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

        res.render('user/allProducts', { products,user, searchQuery: q, selectedSort: sort });
    } catch (error) {
        console.error('Error during search:', error.message);
        res.status(500).send('Error during search');
    }
};