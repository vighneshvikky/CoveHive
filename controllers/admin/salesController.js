const Order = require('../../models/orderSchema')
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit')



const applyDateFilter = (filter) => {
    const now = new Date();
    let dateFilter = {};
  
    if (filter === 'day') {
      dateFilter.createdAt = {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lt: new Date(now.setHours(23, 59, 59, 999)),
      };
    } else if (filter === 'week') {
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay(); 
      const distanceToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); 
     
      startOfWeek.setDate(now.getDate() - distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
  
      // Set end of the week 
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
  
      dateFilter.createdAt = { $gte: startOfWeek, $lt: endOfWeek };
    } else if (filter === 'month') {
      dateFilter.createdAt = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1), // Start of month
        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1), // Start of next month
      };
    } else if (filter === 'year') {
      dateFilter.createdAt = {
        $gte: new Date(now.getFullYear(), 0, 1), // Start of year
        $lt: new Date(now.getFullYear(), 12, 31), // End of year
      };
    }
  
    return dateFilter;
  };
 exports.sales = async (req, res) => {
    try {
      const filter = req.query.filter || ''; 
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;
  
      console.log("page = ",page);
      console.log("limit = ",limit);
      
  
      let queryCondition = {};
  
      if (filter) {
        const dateFilter = applyDateFilter(filter);
        queryCondition = { ...queryCondition, ...dateFilter };
      }
  
      const salesData = await Order.find(queryCondition)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
        
        
        
        
      const totalRecords = await Order.countDocuments(queryCondition);
  
      console.log("Total recodrd = ",totalRecords);
      console.log("sales recodrd = ",salesData);
  
      console.log("totalPages = ",Math.ceil(totalRecords / limit));
  
      const totSalesData = await Order.find(queryCondition)
  
      let orderAmount = totSalesData.reduce((tot,val)=>{
         return  tot += val.totalPrice
      },0)
      let totalCouponDiscount = totSalesData.reduce((tot,val)=>{
         return  tot += val.couponDiscount
      },0)
      
      let totalSalesCount = totSalesData.length;
  
      console.log("Toal sales count : ",totalSalesCount);
      console.log("order amount : ",orderAmount);
      
      
      
  
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({
          data: salesData,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecordsCount: totalRecords,
          overallSalesCount:totalSalesCount,
          overallOrderAmount:orderAmount,
          totalCouponDiscount:totalCouponDiscount
        });
      } else {
        res.render('admin/salesReport', {
          data: salesData,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecordsCount: totalRecords,
          title: 'Sales Report',
          overallSalesCount:totalSalesCount,
          overallOrderAmount:orderAmount,
          totalCouponDiscount:totalCouponDiscount
  
        });
      }
    } catch (error) {
      console.error('Error while rendering the sales report:', error);
  
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
      } else {
        res.status(500).render('error', { message: 'Server Error', error });
      }
    }
  };

  
exports.exportReport = async(req,res)=>{

    try {

        const filter = req.query.filter || '';
        const format = req.query.format;


        let queryCondition = {}

        if(filter){
            const dateFilter = applyDateFilter(filter);
            queryCondition = {...queryCondition,...dateFilter}
        }

        const salesData = await Order.find(queryCondition).sort({createdAt:-1})

        if(format === 'excel'){

            const worksheetData = salesData.map(data => ({
                OrderID: data.order_id,
                UserID: data.customer_id,
                OrderDate: new Date(data.createdAt).toLocaleDateString('en-GB'),
                OrderAmount: `₹${data.priceAfterCouponDiscount.toFixed(2)}`,
                CouponDeduction: `₹${data.couponDiscount.toFixed(2)}`,
                PaymentStatus: data.paymentStatus,
                PaymentMethod: data.paymentMethod,
              }));

              const worksheet = xlsx.utils.json_to_sheet(worksheetData);
              const workbook = xlsx.utils.book_new();
              xlsx.utils.book_append_sheet(workbook,worksheet,'Sales Report');


              const excelBuffer = xlsx.write(workbook,{type:'buffer',bookType:'xlsx'})
              res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
              res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
              return res.send(excelBuffer);
            
          
        }


        if(format === 'pdf'){

            const doc = new PDFDocument();
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"')
            res.setHeader('Content-Type', 'application/pdf');
            doc.pipe(res);


           // Document title
    doc.fontSize(20).font('Helvetica-Bold').text('GameNation Sales Report', { align: 'center' });
    doc.moveDown(2); // Move down for spacing after title

    // Table configuration
    const tableTop = 150; // Starting Y position for the table
    const startX = 30; // Starting X position for the table
    const rowHeight = 30; // Height of each row
    const cellPadding = 5; // Padding inside each cell
    const tableWidth = 650; // Total width of the table to accommodate all columns

    // Define columns and their widths
    const columns = [
        { label: 'Order ID', width: 60 },
        { label: 'User ID', width: 90 },
        { label: 'Order Date', width: 80 },
        { label: 'Order Amount', width: 100 },
        { label: 'Coupon Deduction', width: 70 },
        { label: 'Payment Status', width: 70 },
        { label: 'Payment Method', width: 100 }
    ];

    // Function to draw table borders for each cell
    function drawTableBorders(x, y, width, height) {
        doc.rect(x, y, width, height).stroke();
    }

    // Draw the table headers
    let x = startX;
    let y = tableTop;

    // Draw header row
    doc.fontSize(12).font('Helvetica-Bold');
    columns.forEach(column => {
        doc.text(column.label, x + cellPadding, y + cellPadding, { width: column.width - 2 * cellPadding, align: 'left' });
        drawTableBorders(x, y, column.width, rowHeight); // Draw borders for the header cell
        x += column.width; // Move x to next column
    });

    // Draw the data rows
    y += rowHeight; // Move y to the next row (below headers)
    doc.font('Helvetica').fontSize(10); // Set font for table data

    salesData.forEach((data) => {
        x = startX; // Reset x position for each row
        const truncatedUserId = `${data.customer_id.toString().substring(0, 6)}....${data.customer_id.toString().substring(data.customer_id.toString().length - 6)}`;


        // Draw each column cell for the current row
        const rowData = [
            data.order_id,
            truncatedUserId,
            new Date(data.createdAt).toLocaleDateString('en-GB'),
            `₹${data.priceAfterCouponDiscount.toFixed(2)}`,
            `₹${data.couponDiscount.toFixed(2)}`,
            data.paymentStatus,
            data.paymentMethod
        ];

        rowData.forEach((text, i) => {
            doc.text(text, x + cellPadding, y + cellPadding, { width: columns[i].width - 2 * cellPadding, align: 'left' });
            drawTableBorders(x, y, columns[i].width, rowHeight); // Draw borders for each cell
            x += columns[i].width; // Move x to next column
        });

        y += rowHeight; // Move y to the next row for subsequent data
    });

    // Finalize the document
    doc.end();

        }
       
    } catch (error) {

        console.error('Error generating report:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
  

exports.salesReoprtView = async (req, res) => {
    try {
      const { orderId } = req.query;
  
      const order = await Order.findOne({ _id: orderId }).populate({
        path: "items.productId",
        select: "name category price discount stock image",
        model: 'Product',
        options: { strictPopulate: false },
      });

      console.log(`order = ${order}`)
  
      res.render("admin/saleReportView", {
        title: "Order Details",
        order: order,
      });
    } catch (error) {
      console.log("error in orderview ", error);
    }
  };
  