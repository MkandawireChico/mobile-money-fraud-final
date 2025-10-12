#!/usr/bin/env node

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing PDF Generation...');

try {
    // Create a simple test PDF
    const doc = new PDFDocument({ margin: 50 });
    const outputPath = path.join(__dirname, 'test-report.pdf');

    // Pipe to file
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Add content
    doc.fontSize(20).text('Test PDF Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Test table
    const headers = ['ID', 'Name', 'Amount', 'Status'];
    const testData = [
        { ID: '1', Name: 'Test Transaction 1', Amount: '1000.00', Status: 'Completed' },
        { ID: '2', Name: 'Test Transaction 2', Amount: '2500.50', Status: 'Pending' },
        { ID: '3', Name: 'Test Transaction 3', Amount: '750.25', Status: 'Failed' }
    ];

    // Table headers
    const tableTop = doc.y;
    const itemCodeX = 50;
    let currentX = itemCodeX;
    const columnWidth = (doc.page.width - 100) / headers.length;

    doc.fontSize(10).fillColor('black');
    headers.forEach((header) => {
        doc.text(header, currentX, tableTop, { width: columnWidth, align: 'left' });
        currentX += columnWidth;
    });

    // Header line
    doc.moveTo(itemCodeX, tableTop + 15)
       .lineTo(doc.page.width - 50, tableTop + 15)
       .stroke();

    // Data rows
    let currentY = tableTop + 25;
    testData.forEach((row) => {
        currentX = itemCodeX;
        headers.forEach((header) => {
            const value = String(row[header] || '');
            doc.text(value, currentX, currentY, { width: columnWidth, align: 'left' });
            currentX += columnWidth;
        });
        currentY += 20;
    });

    // Finalize the PDF
    doc.end();

    stream.on('finish', () => {
        console.log('✅ PDF generation test successful!');
        console.log(`📄 Test PDF created at: ${outputPath}`);
        console.log('');
        console.log('🎉 PDF functionality is working correctly.');
        console.log('The report export issues are likely due to:');
        console.log('1. Data formatting problems');
        console.log('2. Network/timeout issues');
        console.log('3. Authentication problems');
        console.log('');
        console.log('Try testing the report endpoints directly with proper authentication.');

        // Clean up test file
        setTimeout(() => {
            try {
                fs.unlinkSync(outputPath);
                console.log('🧹 Test file cleaned up.');
            } catch (err) {
                console.log('ℹ️  Test file cleanup skipped (file may be in use).');
            }
        }, 2000);
    });

    stream.on('error', (error) => {
        console.error('❌ PDF stream error:', error);
    });

} catch (error) {
    console.error('❌ PDF generation test failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check if pdfkit is installed: npm list pdfkit');
    console.log('2. Reinstall pdfkit: npm install pdfkit');
    console.log('3. Check Node.js version compatibility');
    console.log('4. Verify file system permissions');
}
