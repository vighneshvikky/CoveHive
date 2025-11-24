const User = require('../../models/user/userSchema');
const Category = require('../../models/admin/categoryModel');
const Product = require('../../models/admin/productModel');
const Order = require('../../models/orderSchema');
const {orderStatus} = require('../../controllers/user/orderController');


// ------------------------------Render login page--------------------------------------------------------
exports.getLoginPage = async (req, res) => {
    
   try {
    res.render('admin/adminLogin');
   } catch (error) {
    console.log(error.message);
    
   }
};

//-------------------------------handle admin login-------------------------------------------------------
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;
   
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {

      req.session.admin = { email };
      console.log("Session set:", req.session); 
       res.redirect('/admin/dashboard');
    
    }else{
        res.render('admin/adminLogin',{message:"invalid password and email"});
    }


 
   
  };


 

  exports.adminLogout = async (req,res) => {
    try {
      req.session.destroy((err) => {
       if(err){
        console.log(err)
       }
       res.redirect('/admin/login')
      })
    } catch (error) {
      console.log(error.message)
    }
  }
        //---------------------- function for Date Filter   ----------------------
function applyDateFilter(filter) {
  const now = new Date();
  let startDate;

  switch (filter) {
    case "day":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "week":
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  return {
    createdAt: { $gte: startDate }
  };
}

exports.dashboard = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const totalCustomers = await User.find();
    const totalUsers = totalCustomers.length;
    console.log('started aggregation');

    // daily data start
    const dailyOrder = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["Delivered", "Pending", "Shipped", "Paid"] },
          isCancelled: false,
          paid: true
        },
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalDailyOrders: { $sum: 1 },
          totalProductsSold: { $sum: "$items.productCount" },
          totalSales: {
            $sum: {
              $multiply: ["$items.productDiscountPrice", "$items.productCount"],
            },
          },
          totalDailyProfit: {
            $sum: {
              $multiply: ["$items.productDiscountPrice", "$items.productCount", 0.1],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          totalDailyOrders: 1,
          totalProductsSold: 1,
          totalSales: 1,
          totalDailyProfit: 1,
        },
      },
      {
        $sort: { date: -1 },
      },
    ]);

    // Total sale Amount start
    const totalSaleAmount = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["Pending", "Paid", "Delivered", "Shipped"] },
          paid: true
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalPrice" }
        }
      }
    ]);

    const finalTotalSaleAmount = (totalSaleAmount && totalSaleAmount.length > 0 && totalSaleAmount[0]?.totalAmount !== undefined)
      ? totalSaleAmount[0].totalAmount.toFixed(2)
      : "0.00";

    // Top selling products
    const filter = req.query.filter || "year"; // Changed default to "year"
    const dateFilter = applyDateFilter(filter);

    console.log("data filter ", filter);

    const topSellingProducts = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["Delivered", "Shipped", "Pending", "Paid"] },
          isCancelled: false,
          createdAt: dateFilter.createdAt,
          paid: true
        },
      },
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",
          totalQuantitySold: {
            $sum: { $toInt: "$items.productCount" },
          },
          totalRevenue: { $sum: "$items.productPrice" },
          productName: { $first: "$items.productName" },
          category: { $first: "$items.productCategory" },
          productDiscount: { $first: "$items.productDiscount" },
          productPrice: { $first: "$items.productPrice" },
        },
      },
      {
        $sort: { totalQuantitySold: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    console.log(`popular product before populating ${topSellingProducts}`);
    const productData = await Product.populate(topSellingProducts, {
      path: "_id",
      populate: { path: "category", select: "name" },
      select: "name discount category",
    });

    console.log("Product data: ", productData);

    // Category performance - FIXED: Use same filter as other sections
    const categoryFilter = req.query.filter || "year"; // Changed default to "year"
    const CategoryDateFilter = applyDateFilter(categoryFilter);
    console.log(`categoryDateFilter = ${JSON.stringify(CategoryDateFilter)}`);

    const categoryPerfomance = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["Delivered", "Shipped", "Pending", "Paid"] },
          isCancelled: false,
          createdAt: CategoryDateFilter.createdAt,
          paid: true
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productData",
        },
      },
      {
        $unwind: "$productData",
      },
      {
        $lookup: {
          from: "categories",
          localField: "productData.category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      {
        $unwind: "$categoryData",
      },
      {
        $group: {
          _id: "$categoryData.name",
          totalQuantitySold: {
            $sum: { $toInt: "$items.productCount" },
          },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalQuantitySold: 1,
        },
      },
      { $sort: { totalQuantitySold: -1 } },
    ]);

    console.log("categoryPerfomance:", JSON.stringify(categoryPerfomance, null, 2));
    
    // FIXED: Handle empty category data properly
    const categoryLabels = categoryPerfomance.length > 0 
      ? categoryPerfomance.map((item) => item.category)
      : ["No Data"];
    
    const categoryData = categoryPerfomance.length > 0
      ? categoryPerfomance.map((item) => item.totalQuantitySold)
      : [0];

    console.log(`categoryLabels = ${categoryLabels}`);
    console.log(`categoryData = ${categoryData}`);

    // Weekly/filtered dashboard data
    const filterMain = req.query.filter || "year"; // Changed default to "year"
    const dateFilterMain = applyDateFilter(filterMain);

    const order = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: ["Delivered", "Shipped", "Pending", "Paid"] },
          isCancelled: false,
          paid: true,
          createdAt: dateFilterMain.createdAt,
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          totalDailySales: { $sum: "$totalPrice" },
          totalDailyProfit: { $sum: { $multiply: ["$totalPrice", 0.1] } },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // FIXED: Handle empty order data
    const categories = order.length > 0
      ? order.map((item) => `Day ${item._id}`)
      : ["No Data"];
    
    const totalSalesData = order.length > 0
      ? order.map((item) => parseFloat(item.totalDailySales.toFixed(2)))
      : [0];
    
    const totalProfitData = order.length > 0
      ? order.map((item) => parseFloat(item.totalDailyProfit.toFixed(2)))
      : [0];

    console.log("category : ", categories);
    console.log("totalSalesData : ", totalSalesData);
    console.log("totalProfitData: ", totalProfitData);

    // Check if this is an AJAX request
    if (
      req.xhr ||
      req.headers["content-type"] === "application/json" ||
      (req.headers.accept && req.headers.accept.indexOf("json") > -1)
    ) {
      console.log("Fetch request detected");
      return res.json({
        topSellingProducts: productData,
        categoryLabels,
        categoryData,
        categories,
        totalSalesData,
        totalProfitData,
        finalTotalSaleAmount
      });
    }

    console.log(`Final categoryLabels sent to view = ${categoryLabels}`);
    console.log(`Final categoryData sent to view = ${categoryData}`);

    res.render('admin/adminDashboard', {
      dailyOrder,
      totalUsers,
      topSellingProducts: productData,
      categories: JSON.stringify(categories),
      totalSalesData: JSON.stringify(totalSalesData),
      totalProfitData: JSON.stringify(totalProfitData),
      categoryLabels: JSON.stringify(categoryLabels),
      categoryData: JSON.stringify(categoryData),
      finalTotalSaleAmount,
    });

  } catch (error) {
    console.log(`error from dashboard${error}`);
    res.status(500).send("Internal Server Error");
  }
}

exports.dashboardFilter = async(req,res) =>{
  try {
    const filter = req.query.filter;
    let matchCondition = {
      orderStatus: { $in: ["Delivered", "Pending", "Shipped","Paid"] },
      paid:true,
      isCancelled: false,
    };
    let startDate, endDate;

    switch (filter) {
      case "yesterday":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      case "thisWeek":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of the week
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case "thisMonth":
        startDate = new Date();
        startDate.setDate(1); // First day of the month
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case "thisYear":
        startDate = new Date(new Date().getFullYear(), 0, 1); // First day of the year
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        // Default case can be today
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
    }

    matchCondition.createdAt = { $gte: startDate, $lt: endDate };

    const Order = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$productDiscountPrice" },
          totalProfit: {
            $sum: { $multiply: ["$productDiscountPrice", 0.1] },
          },
        },
      },
    ]);

    res.json({
      totalSales: Order[0]?.totalSales || 0,
      totalProfit: Order[0]?.totalProfit || 0,
    }); 
  } catch (error) {
    console.log(`error from dashboardFilter ${error}`)
  }
}