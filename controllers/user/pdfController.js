const PDFDocument = require('pdfkit');
const Order = require('../../models/orderSchema');

exports.generateOrderPDF = async (req, res) => {
    try {
        const { orderId } = req.params;
        console.log('Generating PDF for orderId:', orderId);

        const order = await Order.findById(orderId).populate('items.productId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Validate that products are populated
        const hasInvalidProducts = order.items.some(item => !item.productId);
        if (hasInvalidProducts) {
            return res.status(400).json({ message: 'Some products could not be loaded' });
        }

        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true
        });

        // Set PDF Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);
        
        // Pipe the PDF to response
        doc.pipe(res);

        // Define color scheme
        const colors = {
            primary: '#2563EB',
            secondary: '#64748B',
            accent: '#10B981',
            dark: '#1E293B',
            light: '#F8FAFC',
            border: '#E2E8F0'
        };

        // Page dimensions
        const pageWidth = 595.28; // A4 width in points
        const margin = 50;
        const contentWidth = pageWidth - (margin * 2);

        // ============ HEADER SECTION ============
        // Header background
        doc.rect(0, 0, pageWidth, 120).fill(colors.primary);

        // Company name
        doc.fontSize(32)
           .fillColor('white')
           .font('Helvetica-Bold')
           .text('CoveHive', margin, 35, { width: contentWidth / 2 });

        doc.fontSize(10)
           .font('Helvetica')
           .text('Your Premium E-Commerce Store', margin, 75, { width: contentWidth / 2 })
           .text('Email: support@covehive.com', margin, 90, { width: contentWidth / 2 })
           .text('Phone: +91 1234567890', margin, 102, { width: contentWidth / 2 });

        // Invoice title on right
        doc.fontSize(28)
           .font('Helvetica-Bold')
           .text('INVOICE', margin, 45, { width: contentWidth, align: 'right' });

        // Reset fill color
        doc.fillColor(colors.dark);
        
        let yPos = 150;

        // ============ ORDER & CUSTOMER INFO SECTION ============
        // Left side - Order Information
        doc.fontSize(11)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('INVOICE DETAILS', margin, yPos);

        yPos += 25;

        const leftColumnX = margin;
        const labelWidth = 90;
        const valueX = leftColumnX + labelWidth;

        // Order information
        const orderInfo = [
            { label: 'Invoice No:', value: `#INV-${order._id.toString().slice(-8).toUpperCase()}` },
            { label: 'Order ID:', value: order._id.toString().slice(-12) },
            { label: 'Order Date:', value: new Date(order.createdAt).toLocaleDateString('en-IN', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            })},
            { label: 'Order Time:', value: new Date(order.createdAt).toLocaleTimeString('en-IN') }
        ];

        orderInfo.forEach(info => {
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor(colors.secondary)
               .text(info.label, leftColumnX, yPos);
            
            doc.font('Helvetica-Bold')
               .fillColor(colors.dark)
               .text(info.value, valueX, yPos);
            
            yPos += 20;
        });

        // Right side - Shipping Address Box
        const rightColumnX = 310;
        const rightColumnWidth = contentWidth - rightColumnX + margin;
        const addressBoxY = 150;
        const addressBoxHeight = 140;

        // Draw address box
        doc.rect(rightColumnX, addressBoxY, rightColumnWidth, addressBoxHeight)
           .strokeColor(colors.border)
           .lineWidth(1.5)
           .stroke();

        // Address box header
        doc.rect(rightColumnX, addressBoxY, rightColumnWidth, 30)
           .fill(colors.light);

        doc.fontSize(11)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('SHIP TO', rightColumnX + 15, addressBoxY + 10);

        // Address content
        let addressY = addressBoxY + 45;

        doc.fontSize(11)
           .fillColor(colors.dark)
           .font('Helvetica-Bold')
           .text(order.address.contactName || 'N/A', rightColumnX + 15, addressY, { width: rightColumnWidth - 30 });

        addressY += 20;

        doc.font('Helvetica')
           .fontSize(9)
           .fillColor(colors.secondary);

        if (order.address.street) {
            doc.text(order.address.street, rightColumnX + 15, addressY, { width: rightColumnWidth - 30 });
            addressY += 15;
        }

        doc.text(`${order.address.city || ''}, ${order.address.state || ''}`, rightColumnX + 15, addressY, { width: rightColumnWidth - 30 });
        addressY += 15;

        doc.text(`${order.address.country || ''} - ${order.address.pincode || ''}`, rightColumnX + 15, addressY, { width: rightColumnWidth - 30 });

        if (order.address.phone) {
            addressY += 15;
            doc.text(`Phone: ${order.address.phone}`, rightColumnX + 15, addressY, { width: rightColumnWidth - 30 });
        }

        yPos = addressBoxY + addressBoxHeight + 25;

        // ============ STATUS BADGES ============
        doc.fontSize(11)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text('ORDER STATUS', margin, yPos);

        yPos += 25;

        const badgeHeight = 28;
        const badgeSpacing = 10;
        const badge1X = margin;
        const badge2X = margin + 110;
        const badge3X = margin + 240;

        // Payment Status Badge
        const paymentColor = order.paid ? colors.accent : '#EF4444';
        doc.roundedRect(badge1X, yPos, 100, badgeHeight, 4)
           .fillAndStroke(paymentColor, paymentColor);
        
        doc.fontSize(10)
           .fillColor('white')
           .font('Helvetica-Bold')
           .text(order.paid ? '✓ PAID' : '✗ UNPAID', badge1X, yPos + 9, { width: 100, align: 'center' });

        // Order Status Badge
        doc.roundedRect(badge2X, yPos, 120, badgeHeight, 4)
           .fillAndStroke(colors.primary, colors.primary);
        
        doc.fontSize(10)
           .fillColor('white')
           .text(order.status?.toUpperCase() || 'PROCESSING', badge2X, yPos + 9, { width: 120, align: 'center' });

        // Payment Method Badge
        doc.roundedRect(badge3X, yPos, 130, badgeHeight, 4)
           .fillAndStroke(colors.light, colors.border);
        
        doc.fontSize(10)
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(order.paymentMethod?.toUpperCase() || 'N/A', badge3X, yPos + 9, { width: 130, align: 'center' });

        yPos += 55;

        // ============ ITEMS TABLE ============
        doc.fontSize(13)
           .fillColor(colors.dark)
           .font('Helvetica-Bold')
           .text('ORDER ITEMS', margin, yPos);

        yPos += 25;

        // Table dimensions
        const tableX = margin;
        const tableWidth = contentWidth;
        const rowHeight = 35;

        // Column widths and positions
        const colWidths = {
            item: 230,
            discount: 70,
            qty: 50,
            price: 80,
            total: 80
        };

        const colX = {
            item: tableX + 10,
            discount: tableX + colWidths.item + 10,
            qty: tableX + colWidths.item + colWidths.discount + 10,
            price: tableX + colWidths.item + colWidths.discount + colWidths.qty + 10,
            total: tableX + colWidths.item + colWidths.discount + colWidths.qty + colWidths.price + 10
        };

        // Table header background
        doc.rect(tableX, yPos, tableWidth, 30)
           .fillAndStroke(colors.dark, colors.dark);

        // Table headers
        doc.fontSize(10)
           .fillColor('white')
           .font('Helvetica-Bold')
           .text('ITEM', colX.item, yPos + 10, { width: colWidths.item - 20 })
           .text('DISC', colX.discount, yPos + 10, { width: colWidths.discount - 10, align: 'center' })
           .text('QTY', colX.qty, yPos + 10, { width: colWidths.qty - 10, align: 'center' })
           .text('PRICE', colX.price, yPos + 10, { width: colWidths.price - 10, align: 'right' })
           .text('TOTAL', colX.total, yPos + 10, { width: colWidths.total - 10, align: 'right' });

        yPos += 30;

        // Table rows
        order.items.forEach((item, index) => {
            // Check if we need a new page
            if (yPos > 680) {
                doc.addPage();
                yPos = 50;
            }

            const productName = item.productId.name || 'Unknown Product';
            const discount = item.productId.discount ? `${item.productId.discount}%` : '0%';
            const quantity = item.productCount || 0;
            const price = item.productDiscountPrice || 0;
            const itemTotal = price * quantity;

            // Alternate row background
            if (index % 2 === 0) {
                doc.rect(tableX, yPos, tableWidth, rowHeight)
                   .fill('#FAFAFA');
            }

            // Row border
            doc.rect(tableX, yPos, tableWidth, rowHeight)
               .strokeColor(colors.border)
               .lineWidth(0.5)
               .stroke();

            // Row content
            doc.fontSize(9)
               .fillColor(colors.dark)
               .font('Helvetica')
               .text(productName, colX.item, yPos + 12, { width: colWidths.item - 20, ellipsis: true })
               .text(discount, colX.discount, yPos + 12, { width: colWidths.discount - 10, align: 'center' })
               .text(quantity.toString(), colX.qty, yPos + 12, { width: colWidths.qty - 10, align: 'center' })
               .text(`₹${price.toFixed(2)}`, colX.price, yPos + 12, { width: colWidths.price - 10, align: 'right' })
               .font('Helvetica-Bold')
               .text(`₹${itemTotal.toFixed(2)}`, colX.total, yPos + 12, { width: colWidths.total - 10, align: 'right' });

            yPos += rowHeight;
        });

        yPos += 25;

        // ============ PRICING SUMMARY ============
        const summaryX = pageWidth - margin - 220;
        const summaryWidth = 220;
        const summaryLabelX = summaryX + 15;
        const summaryValueX = summaryX + summaryWidth - 15;

        // Summary box
        doc.rect(summaryX, yPos, summaryWidth, 110)
           .fillAndStroke(colors.light, colors.border);

        yPos += 15;

        // Subtotal
        const subtotal = order.subtotal || order.totalPrice;
        doc.fontSize(10)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('Subtotal:', summaryLabelX, yPos);
        
        doc.fillColor(colors.dark)
           .font('Helvetica-Bold')
           .text(`₹${subtotal.toFixed(2)}`, summaryValueX - 80, yPos, { width: 80, align: 'right' });

        yPos += 22;

        // Coupon Discount
        if (order.couponDiscount && order.couponDiscount > 0) {
            doc.fillColor(colors.accent)
               .font('Helvetica')
               .text('Discount:', summaryLabelX, yPos);
            
            doc.text(`- ₹${order.couponDiscount.toFixed(2)}`, summaryValueX - 80, yPos, { width: 80, align: 'right' });
            yPos += 22;
        }

        // Divider
        doc.moveTo(summaryLabelX, yPos)
           .lineTo(summaryValueX, yPos)
           .strokeColor(colors.border)
           .lineWidth(1)
           .stroke();

        yPos += 15;

        // Total box
        doc.rect(summaryX, yPos - 5, summaryWidth, 38)
           .fillAndStroke(colors.primary, colors.primary);

        doc.fontSize(12)
           .fillColor('white')
           .font('Helvetica-Bold')
           .text('TOTAL AMOUNT:', summaryLabelX, yPos + 8);
        
        doc.fontSize(14)
           .text(`₹${order.totalPrice.toFixed(2)}`, summaryValueX - 100, yPos + 8, { width: 100, align: 'right' });

        // ============ FOOTER ============
        const footerY = 750;

        doc.moveTo(margin, footerY)
           .lineTo(pageWidth - margin, footerY)
           .strokeColor(colors.border)
           .lineWidth(1)
           .stroke();

        doc.fontSize(10)
           .fillColor(colors.dark)
           .font('Helvetica-Bold')
           .text('Thank you for your business!', margin, footerY + 15, { width: contentWidth, align: 'center' });

        doc.fontSize(8)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text('This is a computer-generated invoice and does not require a signature.', margin, footerY + 32, { width: contentWidth, align: 'center' })
           .text('For any queries, contact us at support@covehive.com or call +91 1234567890', margin, footerY + 45, { width: contentWidth, align: 'center' });

        // Page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8)
               .fillColor(colors.secondary)
               .text(`Page ${i + 1} of ${pages.count}`, margin, 780, { width: contentWidth, align: 'center' });
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error(`PDF Generation Error:`, error);
        
        if (!res.headersSent) {
            res.status(500).json({
                message: 'Failed to generate PDF',
                error: error.message
            });
        }
    }
};