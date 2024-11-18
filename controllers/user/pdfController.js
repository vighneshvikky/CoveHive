const PDFDocument = require('pdfkit');
const Order = require('../../models/orderSchema');


exports.generateOrderPDF = async (req,res) =>{
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        // PDF Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-${orderId}.pdf`);
        doc.pipe(res);

        // Order Header
        doc.fontSize(20)
           .text('Order Summary', { align: 'center' })
           .moveDown();

        // Order Details
        doc.fontSize(12)
           .text(`Order ID: ${order._id}`)
           .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
           .text(`Order Status: ${order.orderStatus}`)
           .text(`Payment Method: ${order.paymentMethod}`)
           .moveDown();

        // Shipping Address
        doc.fontSize(14)
           .text('Shipping Address', { underline: true })
           .fontSize(12)
           .text(order.address.contactName)
           .text(order.address.street || '')
           .text(`${order.address.city}, ${order.address.state} ${order.address.pincode}`)
           .moveDown();

        // Items Table
        doc.fontSize(14)
           .text('Items Purchased', { underline: true })
           .moveDown();
           const tablePositions = {
            product: 50,
            discount: 200,
            quantity: 280,
            price: 350,
            total: 450
        };
        
        // Table Header
        const tableTop = doc.y;
        doc.fontSize(12)
           .text('Product', tablePositions.product, tableTop)
           .text('Discount', tablePositions.discount, tableTop)
           .text('Qty', tablePositions.quantity, tableTop)
           .text('Price', tablePositions.price, tableTop)
        
        // Underline header
        doc.moveTo(50, tableTop + 15)
           .lineTo(550, tableTop + 15)
           .stroke();
        
        // Start items below header
        let yPosition = tableTop + 25;
        

        doc.moveTo(50, doc.y + 10)
           .lineTo(550, doc.y + 10)
           .stroke();

        // Items Rows
      
        order.items.forEach(item => {
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            doc.fontSize(12)
               .text(item.productId.name, tablePositions.product, yPosition)
               .text(item.productId.discount || 'N/A', tablePositions.discount, yPosition)
               .text(item.productCount.toString(), tablePositions.quantity, yPosition)
               .text(`₹${item.productDiscountPrice}*${item.productCount}`, tablePositions.price, yPosition)
              

            yPosition += 30;
        });

        // Total Amount
        doc.fontSize(14)
           .text(`Total Amount: ₹${order.totalPrice}`, { align: 'right' })
           .moveDown();

        // Footer
        doc.fontSize(10)
           .text('Thank you for your order!', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error(`PDF Generation Error: ${error.message}`);
        res.status(500).json({
            message: 'Failed to generate PDF',
            error: error.message
        });
    }
};
