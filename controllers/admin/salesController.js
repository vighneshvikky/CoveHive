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

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    dateFilter.createdAt = { $gte: startOfWeek, $lt: endOfWeek };
  } else if (filter === 'month') {
    dateFilter.createdAt = {
      $gte: new Date(now.getFullYear(), now.getMonth(), 1),
      $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  } else if (filter === 'year') {
    dateFilter.createdAt = {
      $gte: new Date(now.getFullYear(), 0, 1),
      $lt: new Date(now.getFullYear() + 1, 0, 1),
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

    let queryCondition = {
      orderStatus: { $in: ["Pending", "Paid", "Delivered", "Shipped"] },
      paid: true
    };

    if (filter) {
      const dateFilter = applyDateFilter(filter);
      queryCondition = { ...queryCondition, ...dateFilter };
    }

    const salesData = await Order.find(queryCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Order.countDocuments(queryCondition);
    const totSalesData = await Order.find(queryCondition);

    let orderAmount = totSalesData.reduce((tot, val) => {
      return tot + val.totalPrice;
    }, 0);

    let totalCouponDiscount = totSalesData.reduce((tot, val) => {
      return tot + Math.abs(val.couponDiscount);
    }, 0);

    let totalSalesCount = totSalesData.length;

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({
        data: salesData,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecordsCount: totalRecords,
        overallSalesCount: totalSalesCount,
        overallOrderAmount: orderAmount,
        totalCouponDiscount: totalCouponDiscount
      });
    } else {
      res.render('admin/salesReport', {
        data: salesData,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecordsCount: totalRecords,
        overallSalesCount: totalSalesCount,
        overallOrderAmount: orderAmount,
        totalCouponDiscount: totalCouponDiscount
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

exports.exportReport = async (req, res) => {
  try {
    const filter = req.query.filter || '';
    const format = req.query.format;

    let queryCondition = {
      orderStatus: { $in: ["Pending", "Paid", "Delivered", "Shipped"] },
      paid: true
    };

    if (filter) {
      const dateFilter = applyDateFilter(filter);
      queryCondition = { ...queryCondition, ...dateFilter };
    }

    const salesData = await Order.find(queryCondition).sort({ createdAt: -1 });

    // Calculate totals
    let totalOrderAmount = salesData.reduce((tot, val) => tot + val.totalPrice, 0);
    let totalCouponDiscount = salesData.reduce((tot, val) => tot + Math.abs(val.couponDiscount), 0);
    let totalSalesCount = salesData.length;

    if (format === 'excel') {
      console.log('Generating Excel report');

      const worksheetData = salesData.map(data => ({
        'Order ID': data.orderId,
        'User ID': data.userId.toString(),
        'Order Date': new Date(data.createdAt).toLocaleDateString('en-GB'),
        'Order Amount': data.totalPrice.toFixed(2),
        'Coupon Deduction': data.couponDiscount.toFixed(2),
        'Payment Status': data.orderStatus,
        'Payment Method': data.paymentMethod,
      }));

      // Add summary rows
      worksheetData.push({});
      worksheetData.push({
        'Order ID': 'SUMMARY',
        'User ID': '',
        'Order Date': '',
        'Order Amount': '',
        'Coupon Deduction': '',
        'Payment Status': '',
        'Payment Method': ''
      });
      worksheetData.push({
        'Order ID': 'Total Orders',
        'User ID': totalSalesCount,
        'Order Date': '',
        'Order Amount': '',
        'Coupon Deduction': '',
        'Payment Status': '',
        'Payment Method': ''
      });
      worksheetData.push({
        'Order ID': 'Total Sales Amount',
        'User ID': `₹${totalOrderAmount.toFixed(2)}`,
        'Order Date': '',
        'Order Amount': '',
        'Coupon Deduction': '',
        'Payment Status': '',
        'Payment Method': ''
      });
      worksheetData.push({
        'Order ID': 'Total Discounts',
        'User ID': `₹${totalCouponDiscount.toFixed(2)}`,
        'Order Date': '',
        'Order Amount': '',
        'Coupon Deduction': '',
        'Payment Status': '',
        'Payment Method': ''
      });

      const worksheet = xlsx.utils.json_to_sheet(worksheetData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 },  // Order ID
        { wch: 25 },  // User ID
        { wch: 12 },  // Order Date
        { wch: 15 },  // Order Amount
        { wch: 18 },  // Coupon Deduction
        { wch: 15 },  // Payment Status
        { wch: 15 }   // Payment Method
      ];

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

      const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(excelBuffer);
    }
    else if (format === 'pdf') {
      console.log('Generating PDF report');
      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('CoveHive Sales Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666')
        .text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
      doc.moveDown(1.5);

      // Summary boxes
      const summaryY = doc.y;
      const boxWidth = 160;
      const boxHeight = 60;
      const boxSpacing = 20;

      // Total Orders Box
      doc.roundedRect(30, summaryY, boxWidth, boxHeight, 5).fillAndStroke('#3B82F6', '#3B82F6');
      doc.fillColor('#FFF').fontSize(10).text('Total Orders', 40, summaryY + 15, { width: boxWidth - 20 });
      doc.fontSize(20).font('Helvetica-Bold').text(totalSalesCount.toString(), 40, summaryY + 30, { width: boxWidth - 20 });

      // Total Revenue Box
      doc.roundedRect(30 + boxWidth + boxSpacing, summaryY, boxWidth, boxHeight, 5).fillAndStroke('#10B981', '#10B981');
      doc.fillColor('#FFF').fontSize(10).font('Helvetica').text('Total Revenue', 40 + boxWidth + boxSpacing, summaryY + 15, { width: boxWidth - 20 });
      doc.fontSize(16).font('Helvetica-Bold').text(`₹${totalOrderAmount.toFixed(2)}`, 40 + boxWidth + boxSpacing, summaryY + 30, { width: boxWidth - 20 });

      // Total Discounts Box
      doc.roundedRect(30 + (boxWidth + boxSpacing) * 2, summaryY, boxWidth, boxHeight, 5).fillAndStroke('#8B5CF6', '#8B5CF6');
      doc.fillColor('#FFF').fontSize(10).font('Helvetica').text('Total Discounts', 40 + (boxWidth + boxSpacing) * 2, summaryY + 15, { width: boxWidth - 20 });
      doc.fontSize(16).font('Helvetica-Bold').text(`₹${totalCouponDiscount.toFixed(2)}`, 40 + (boxWidth + boxSpacing) * 2, summaryY + 30, { width: boxWidth - 20 });

      doc.moveDown(6);

      // Table
      const tableTop = doc.y;
      const startX = 30;
      const rowHeight = 25;
      const cellPadding = 5;

      const columns = [
        { label: 'Order ID', width: 70 },
        { label: 'User ID', width: 90 },
        { label: 'Date', width: 70 },
        { label: 'Amount', width: 75 },
        { label: 'Discount', width: 70 },
        { label: 'Status', width: 70 },
        { label: 'Method', width: 90 }
      ];

      function drawTableRow(x, y, rowData, isHeader = false) {
        let currentX = x;

        if (isHeader) {
          doc.fillColor('#F3F4F6');
          doc.rect(x, y, columns.reduce((sum, col) => sum + col.width, 0), rowHeight).fill();
          doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
        } else {
          doc.fillColor('#000').font('Helvetica').fontSize(8);
        }

        rowData.forEach((text, i) => {
          doc.text(text, currentX + cellPadding, y + cellPadding + 3, {
            width: columns[i].width - 2 * cellPadding,
            align: 'left',
            lineBreak: false,
            ellipsis: true
          });
          currentX += columns[i].width;
        });

        // Draw borders
        doc.strokeColor('#E5E7EB').lineWidth(0.5);
        currentX = x;
        columns.forEach(col => {
          doc.rect(currentX, y, col.width, rowHeight).stroke();
          currentX += col.width;
        });
      }

      let y = tableTop;

      // Header row
      drawTableRow(startX, y, columns.map(col => col.label), true);
      y += rowHeight;

      // Data rows
      salesData.forEach((data) => {
        if (y > 700) { // Add new page if needed
          doc.addPage();
          y = 30;
          drawTableRow(startX, y, columns.map(col => col.label), true);
          y += rowHeight;
        }

        const truncatedUserId = data.userId.toString().length > 12
          ? `${data.userId.toString().substring(0, 6)}...${data.userId.toString().slice(-3)}`
          : data.userId.toString();

        const rowData = [
          data.orderId,
          truncatedUserId,
          new Date(data.createdAt).toLocaleDateString('en-GB'),
          `₹${data.totalPrice.toFixed(2)}`,
          `₹${data.couponDiscount.toFixed(2)}`,
          data.orderStatus,
          data.paymentMethod
        ];

        drawTableRow(startX, y, rowData);
        y += rowHeight;
      });

      // Footer
      doc.fontSize(8).fillColor('#666').text(
        `Report generated on ${new Date().toLocaleString('en-GB')} | CoveHive Sales System`,
        30,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 60 }
      );

      doc.end();
    } else {
      res.status(400).json({ message: 'Invalid format specified' });
    }

  } catch (error) {
    console.error('Error generating report:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  }
};

exports.salesReoprtView = async (req, res) => {
  try {
    const { orderId } = req.query;
    const order = await Order.findOne({ _id: orderId }).populate("items.productId");

    res.render("admin/saleReportView", {
      title: "Order Details",
      order: order,
    });
  } catch (error) {
    console.log("error in orderview ", error);
  }
};