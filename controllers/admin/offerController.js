const { isblocked } = require('../../middlewares/user/userAuth');
const Category = require('../../models/admin/categoryModel');
const Offer = require('../../models/offerSchema');
const Product = require('../../models/admin/productModel');
const { HttpStatus } = require('../../enums/app.enums');




exports.offers = async (req, res) => {
    try {
      const categories = await Category.find({isBlocked:false});
      const offers = await Offer.find({ isActive: true }).populate(
        "offerCategory"
);
  
      res.render("admin/offers", {
        categories,
        title: "offers",
        offers,
      });
    } catch (error) {
      console.log("Error while rendering offers : ", error);
    }
  };
  
  
  //---------------------- offer adding post controller ----------------------
  
  
  exports.addOfferPost = async (req, res) => {
    try {
      const { offerCategory, name, percentage } = req.body;

      console.log(`offerCategory = ${offerCategory}`)
  
      console.log(offerCategory, "---", name, "----", percentage);
      if (!offerCategory || !name || !percentage) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ status: error, message: "All fields are required." });
      }
  
      const isCategory = await Category.findById(offerCategory);
  
      if (!isCategory) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: "Category not found." });
      }
  
      const products = await Product.find({ category: offerCategory });
  
      if (products.length === 0) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: "No products found in this category." });
      }
  
      const newOffer = Offer({
        offerCategory: offerCategory,
        offerName: name,
        discountPercentage: parseInt(percentage),
        isActive: true,
      });
  
      const updatePromises = products.map((product) => {
        product.discount += parseInt(percentage);
        return product.save();
      });
  
      await Promise.all(updatePromises);
      await newOffer.save();
  
      console.log(products);
  
      res.status(HttpStatus.OK).json({
        status: "success",
        message: "Offer created successfully!",
      });
    } catch (error) {
      console.error("Error while creating offer:", error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "An error occurred while creating the offer.",
        error: error.message,
      });
    }
  };
  
  //---------------------- Offer removing  ----------------------
  
  exports.removeOffer = async (req, res) => {
    try {
      const { offerId } = req.body;
  
      if (!offerId) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: "Offer ID is required." });
      }
  
      const offer = await Offer.findById(offerId);
      if (!offer) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: "Offer not found." });
      }
  
      offer.isActive = false;
      await offer.save();
  
      const products = await Product.find({ category: offer.offerCategory });
  
      const updatePromises = products.map((product) => {
        product.discount -= offer.discountPercentage; // Decrease the discount
        if (product.discount < 0) product.discount = 0; // Ensure discount doesn't go negative
        return product.save();
      });
  
      await Promise.all(updatePromises);
  
      return res.status(HttpStatus.OK).json({
        status: "success",
        message: "Offer removed and products updated successfully!",
      });
    } catch (error) {
      console.error("Error while removing offer:", error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: "error",
        message: "Failed to remove offer. Please try again later.",
      });
    }
  };