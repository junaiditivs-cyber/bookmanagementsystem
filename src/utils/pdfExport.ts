import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PDFExportColumn {
  header: string;
  dataKey: string;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: PDFExportColumn[];
  rows: any[];
  summaryData?: { label: string; value: string | number }[];
  fileName?: string;
}

export function exportToPDF(options: PDFExportOptions) {
  const { title, subtitle, columns, rows, summaryData, fileName } = options;

  // Create document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header design
  doc.setFillColor(39, 39, 42); // bg-zinc-800 color (dark charcoal)
  doc.rect(0, 0, pageWidth, 40, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Junaid Books Management System", 14, 18);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(191, 191, 191);
  doc.text("Professional Book Stock, Sales & Distribution Ledger", 14, 25);

  // Horizontal separator line in header
  doc.setDrawColor(63, 63, 70); // zinc-700
  doc.setLineWidth(0.5);
  doc.line(14, 29, pageWidth - 14, 29);

  // Report Specific Header Title
  doc.setTextColor(96, 165, 250); // blue-400
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), 14, 35);

  // Generated Info
  doc.setTextColor(161, 161, 170); // zinc-400
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const now = new Date();
  doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, pageWidth - 80, 35);

  let currentY = 48;

  // Render Subtitle Info if any
  if (subtitle) {
    doc.setTextColor(39, 39, 42); // zinc-800
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(subtitle, 14, currentY);
    currentY += 8;
  }

  // Render Summary KPI Box if any
  if (summaryData && summaryData.length > 0) {
    doc.setFillColor(244, 244, 245); // zinc-100
    doc.setDrawColor(228, 228, 231); // zinc-200
    doc.setLineWidth(0.2);
    
    // Draw rounded container for summary info
    doc.rect(14, currentY, pageWidth - 28, 16, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122); // zinc-500

    let startX = 20;
    const stepX = (pageWidth - 36) / summaryData.length;

    summaryData.forEach((item, index) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text(item.label, startX + (index * stepX), currentY + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(24, 24, 27); // zinc-900
      doc.text(String(item.value), startX + (index * stepX), currentY + 12);
    });

    currentY += 24;
  }

  // Table Columns Setup
  const tableHeaders = columns.map(col => col.header);
  const tableRows = rows.map(row => columns.map(col => {
    const val = row[col.dataKey];
    return val !== undefined ? String(val) : "";
  }));

  // Render main data table
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [39, 39, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [63, 63, 70]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = doc.getNumberOfPages();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170); // zinc-400
      doc.text(
        `Page ${data.pageNumber} of ${totalPages}`, 
        pageWidth - 25, 
        pageHeight - 10
      );
      doc.text(
        "Junaid Books Management System - Confidential Stock Record", 
        14, 
        pageHeight - 10
      );
    }
  });

  // Save the PDF
  const finalFileName = fileName || `${title.toLowerCase().replace(/\s+/g, "_")}_report.pdf`;
  doc.save(finalFileName);
}
