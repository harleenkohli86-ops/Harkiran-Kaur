import { jsPDF } from 'jspdf';
import { OrderItem } from '../types';

/**
 * HK Code of Rankers — Professional PDF Invoice Generator
 * Generates an official, A4-sized tax invoice and payment receipt in true PDF format.
 */
export function generateInvoicePDF(order: OrderItem): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. TOP HEADER BANNER (Dark Luxury styling)
  doc.setFillColor(15, 15, 15); // #0F0F0F
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Gold accent bar
  doc.setFillColor(200, 164, 93); // #C8A45D
  doc.rect(0, 42, pageWidth, 2, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 227, 160); // #FFE3A0
  doc.text('HK CODE OF RANKERS', margin, 16);

  // Brand Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 164, 93); // #C8A45D
  doc.text('1-ON-1 CS MENTORSHIP & EVALUATED TEST SERIES', margin, 23);

  doc.setFontSize(7.5);
  doc.setTextColor(220, 220, 220);
  doc.text('Founder: Harkiran Kaur (AIR 3 CS Professional)', margin, 29);
  doc.text('Official Portal: hkcodeofrankers.com • Helpline: +91 92840 84523', margin, 35);

  // Right Header: TAX INVOICE label & date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', pageWidth - margin, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 164, 93);
  doc.text(`INVOICE NO: INV-${order.orderNumber}`, pageWidth - margin, 23, { align: 'right' });

  doc.setTextColor(200, 200, 200);
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`DATE: ${orderDate}`, pageWidth - margin, 29, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94); // Emerald
  doc.text('STATUS: PAID & CONFIRMED', pageWidth - margin, 35, { align: 'right' });

  // 2. BILLED TO / BILLED BY SECTION (Two clean boxes)
  let y = 52;

  // Left Box: Student / Billed To
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(220, 210, 195);
  doc.roundedRect(margin, y, (contentWidth - 6) / 2, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(138, 101, 30); // #8A651E
  doc.text('BILLED TO (STUDENT):', margin + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text(order.billingDetails.fullName || 'Student', margin + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`Phone: ${order.billingDetails.phone || 'N/A'}`, margin + 4, y + 19);
  doc.text(`Email: ${order.billingDetails.email || 'N/A'}`, margin + 4, y + 24);
  doc.text('Program: ICSI CS Aspirant 2026 Batch', margin + 4, y + 29);
  doc.text('Enrollment Status: Official Batch Confirmed', margin + 4, y + 34);

  // Right Box: Billed By Details
  const rightX = margin + (contentWidth - 6) / 2 + 6;
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(rightX, y, (contentWidth - 6) / 2, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(138, 101, 30);
  doc.text('BILLED BY:', rightX + 4, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('HK Code of Rankers', rightX + 4, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text('Proprietor: Harkiran Kaur', rightX + 4, y + 20);
  doc.text('Email: hk.code.of.rankers@gmail.com', rightX + 4, y + 26);
  doc.text('Verified UPI ID: harkirankaurr@ibl', rightX + 4, y + 32);

  // 3. TABLE OF PURCHASED ITEMS
  y = 98;

  // Table Header
  doc.setFillColor(26, 24, 21); // #1A1815
  doc.rect(margin, y, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 227, 160); // Gold
  doc.text('#', margin + 3, y + 5.5);
  doc.text('PROGRAM / ITEM DESCRIPTION', margin + 12, y + 5.5);
  doc.text('QTY', margin + 115, y + 5.5, { align: 'center' });
  doc.text('RATE (INR)', margin + 145, y + 5.5, { align: 'right' });
  doc.text('TOTAL (INR)', pageWidth - margin - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Table Rows
  order.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(253, 252, 250);
      doc.rect(margin, y, contentWidth, 11, 'F');
    }

    doc.setDrawColor(235, 230, 220);
    doc.line(margin, y + 11, pageWidth - margin, y + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(`${index + 1}`, margin + 3, y + 5);

    // Item title
    const itemName = item.name.length > 52 ? item.name.substring(0, 50) + '...' : item.name;
    doc.text(itemName, margin + 12, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    doc.text('1-on-1 Mentorship • Evaluated Answer Sheets • Daily Study Routine', margin + 12, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(`${item.quantity}`, margin + 115, y + 6, { align: 'center' });
    doc.text(`₹${item.price.toLocaleString('en-IN')}/-`, margin + 145, y + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`₹${(item.quantity * item.price).toLocaleString('en-IN')}/-`, pageWidth - margin - 4, y + 6, {
      align: 'right',
    });

    y += 11;
  });

  // Outer border for table
  doc.setDrawColor(200, 185, 165);
  doc.rect(margin, 98, contentWidth, y - 98);

  // 4. TOTALS & FINANCIAL SUMMARY
  y += 4;
  const summaryWidth = 78;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFillColor(250, 248, 245);
  doc.roundedRect(summaryX, y, summaryWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Subtotal:', summaryX + 4, y + 6);
  doc.text(`₹${order.subtotal.toLocaleString('en-IN')}/-`, pageWidth - margin - 4, y + 6, { align: 'right' });

  if (order.discount > 0) {
    doc.setTextColor(22, 163, 74); // Green
    doc.text('Promotional Discount:', summaryX + 4, y + 12);
    doc.text(`-₹${order.discount.toLocaleString('en-IN')}/-`, pageWidth - margin - 4, y + 12, { align: 'right' });
  }

  doc.setDrawColor(220, 210, 195);
  doc.line(summaryX + 4, y + 16, pageWidth - margin - 4, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 15, 15);
  doc.text('TOTAL PAID:', summaryX + 4, y + 23);

  doc.setTextColor(138, 101, 30);
  doc.text(`₹${order.totalAmount.toLocaleString('en-IN')}/-`, pageWidth - margin - 4, y + 23, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('(Inclusive of all evaluation & portal access)', summaryX + 4, y + 28);

  // 5. PAYMENT & TRANSACTION VERIFICATION BOX (Left side)
  const payBoxWidth = contentWidth - summaryWidth - 6;
  doc.setFillColor(245, 248, 245);
  doc.setDrawColor(187, 222, 195);
  doc.roundedRect(margin, y, payBoxWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52); // Dark green
  doc.text('✓ VERIFIED DIRECT UPI PAYMENT', margin + 4, y + 6);

  // Extract clean UTR
  const cleanUtr = order.utrNumber || 'Verified UPI Transfer';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`Payment Method: Direct UPI / IMPS Transfer`, margin + 4, y + 12);
  doc.text(`Payee Account: Harkiran kaur jatinder singh kohli`, margin + 4, y + 17);
  doc.text(`Payee UPI ID: harkirankaurr@ibl`, margin + 4, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text(`Transaction UTR: ${cleanUtr}`, margin + 4, y + 28);

  // 6. ONBOARDING & 24-HOUR COMMITMENT NOTICE
  y += 38;

  doc.setFillColor(254, 252, 247);
  doc.setDrawColor(230, 210, 175);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(138, 101, 30);
  doc.text('IMPORTANT ENROLLMENT NOTICE & 24-HOUR ONBOARDING PROMISE:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(
    '1. Mentor Strategy Session: Harkiran Kaur or senior admissions will contact you on your registered mobile number within 24 hours.',
    margin + 4,
    y + 12
  );
  doc.text(
    '2. Study Materials & Answer Evaluation: You will receive syllabus schedules, chapter-wise test papers, and private review drive links.',
    margin + 4,
    y + 17
  );
  doc.text(
    '3. For urgent onboarding assistance, call or message our dedicated student helpline directly at +91 92840 84523.',
    margin + 4,
    y + 22
  );

  // 7. AUTHORIZED SIGNATURE & SEAL
  y += 30;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Terms: All fees paid are non-refundable once custom evaluation schedules are generated.', margin, y + 8);
  doc.text('This digital invoice is system generated and acts as valid proof of admission.', margin, y + 13);

  // Signatory on Right
  const signX = pageWidth - margin - 50;
  doc.setDrawColor(180, 160, 130);
  doc.line(signX, y + 10, pageWidth - margin, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Harkiran Kaur Kohli', signX + 25, y + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(138, 101, 30);
  doc.text('Founder & Head Mentor (AIR 3)', signX + 25, y + 18, { align: 'center' });
  doc.text('HK Code of Rankers', signX + 25, y + 22, { align: 'center' });

  // 8. BOTTOM FOOTER BAR
  doc.setFillColor(15, 15, 15);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(200, 164, 93);
  doc.text('HK CODE OF RANKERS • PREMIER ICSI CS MENTORSHIP & TEST SERIES', pageWidth / 2, pageHeight - 6, {
    align: 'center',
  });

  // Save the generated PDF document directly to user's downloads folder
  const fileName = `HK_Invoice_${order.orderNumber}.pdf`;
  doc.save(fileName);
}
