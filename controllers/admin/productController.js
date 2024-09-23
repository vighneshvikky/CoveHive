const productSchema = require('../../models/admin/productModel');

const categorySchema = require('../../models/admin/categoryModel');

const upload = require('../../middlewares/multer');

const fs = require('fs');

exports.product = async (req,res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        
        const products = await productSchema.find({ productName: { $regex: search, $options: 'i' } })
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ updatedAt : -1 });

        const count = await productSchema.countDocuments({ productName: { $regex: search, $options: 'i' } });

        res.render('admin/products',{
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search,
            limit,page
        });
    } catch (error) {
        console.log(error.message);
        
    }
}