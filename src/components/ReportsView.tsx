import React, { useMemo, useState } from "react";
import { 
  FileText, Search, Printer, Download, Calendar, Filter, Users, BookOpen, Building2, Layers, Bookmark, Tags
} from "lucide-react";
import { DatabaseSchema, Book } from "../types";
import { exportToPDF } from "../utils/pdfExport";

interface ReportsViewProps {
  data: DatabaseSchema;
}

type ReportRow = {
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  col5: string;
  col6: string;
  col7: string;
  col8: string;
};

export default function ReportsView({ data }: ReportsViewProps) {
    const MAX_RENDERED_ROWS = 150;
  const [selectedReportId, setSelectedReportId] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterBook, setFilterBook] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const reports = [
    { id: "1", name: "Stock Entry Register", desc: "List of all direct warehouse stock additions" },
    { id: "2", name: "Sales Register", desc: "Detailed summary of posted sales and invoice lines" },
    { id: "3", name: "Customer Return Register", desc: "Logs of all books returned by schools/shops" },
    { id: "4", name: "Publisher Return Register", desc: "Consignments sent back to publishers" },
    { id: "5", name: "Stock Transfer Register", desc: "Inter-location inventory movement logs" },
    { id: "6", name: "Damage/Loss Register", desc: "Deductions for damages, loss, or free samples" },
    { id: "7", name: "Available Stock Report", desc: "Current items with positive available stock balances" },
    { id: "8", name: "Low Stock Report", desc: "Items below reorder levels requiring replenishment" },
    { id: "9", name: "Out of Stock Report", desc: "Books with zero quantities across all locations" },
    { id: "10", name: "Publisher-wise Stock Report", desc: "Inventory balances and values grouped by publishers" },
    { id: "11", name: "Subject-wise Stock Report", desc: "Book counts and stock levels grouped by curriculum subjects" },
    { id: "12", name: "Class-wise Stock Report", desc: "Stock distribution grouped by target student grades" },
    { id: "13", name: "Location-wise Stock Report", desc: "Breakdown of item stock quantities for each warehouse node" },
    { id: "14", name: "Book-wise Stock History", desc: "Audit card ledger for checking any selected book movement" },
    { id: "15", name: "Monthly Stock In/Out Report", desc: "Monthly summary of cumulative additions vs distributions" },
    { id: "16", name: "Stock Value Report", desc: "Total asset values, purchase cost totals, and expected retail margins" },
  ];

  // Dynamic headers for each report
  const getHeadersForReport = () => {
    switch (selectedReportId) {
      case "1":
        return ["Date", "Entry No.", "Book Title", "Warehouse", "Qty", "Cost (PKR)", "Total (PKR)", "Ref. No."];
      case "2":
        return ["Date", "Invoice No.", "Client Name", "Selling Location", "Book Title", "Qty Sold", "Price (PKR)", "Line Total"];
      case "3":
        return ["Date", "Return No.", "Customer", "Location", "Book Title", "Qty Returned", "Reason", "Notes"];
      case "4":
        return ["Date", "Return No.", "Publisher", "Source Location", "Book Title", "Qty Returned", "Reason", "Notes"];
      case "5":
        return ["Date", "Transfer No.", "Book Title", "From Location", "To Location", "Qty", "Notes", "Status"];
      case "6":
        return ["Date", "Category", "Book Title", "Location", "Qty Deducted", "Explanation Notes", "", ""];
      case "7":
        return ["Book Code", "Book Title", "Publisher", "Cost", "Price", "Stock Balance", "Total Asset Value", "Status"];
      case "8":
        return ["Book Code", "Book Title", "Publisher", "Stock Balance", "Reorder Level", "Cost", "Total Value", "Alert"];
      case "9":
        return ["Book Code", "Book Title", "Publisher", "Stock Balance", "Cost", "Price", "", "Status"];
      case "10":
        return ["Pub Code", "Publisher Name", "Unique Titles", "Stock Balances", "Asset Cost Value", "Incharge Person", "Phone", ""];
      case "11":
        return ["Subject ID", "Subject Name", "Registered books", "Stock Copies", "Asset Cost Value", "", "", ""];
      case "12":
        return ["Class ID", "Class Name", "Unique books", "Stock Copies", "Asset Cost Value", "", "", ""];
      case "13":
        return ["Loc Code", "Location Name", "Type", "Units Stored", "Asset Cost Value", "City", "Manager Incharge", "Status"];
      case "14":
        return ["Date", "Book Title", "Storage Node", "Movement Type", "Qty In (+)", "Qty Out (-)", "Balance After", "Ref Reference"];
      case "15":
        return ["Year-Month", "Description Summary", "Direct Additions", "Distributions", "Net Flow Change", "", "", ""];
      case "16":
        return ["Book Code", "Book Title", "Stock Copies", "Cost Price", "Asset Value Cost", "Retail Price", "Asset Value Retail", "Expected Margins"];
      default:
        return ["Col 1", "Col 2", "Col 3", "Col 4", "Col 5", "Col 6", "Col 7", "Col 8"];
    }
  };

  const headers = getHeadersForReport();

  // Helper to filter by Date range
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return true;
    const itemDate = new Date(dateStr).getTime();
    if (startDate && new Date(startDate).getTime() > itemDate) return false;
    if (endDate && new Date(endDate).getTime() + 86400000 < itemDate) return false; // inclusive of end date
    return true;
  };

  // Helper to compute available stocks
    const stockByBookId = useMemo(() => {
    const map = new Map<string, number>();

    for (const balance of data.stock_balances || []) {
      map.set(balance.book_id, (map.get(balance.book_id) || 0) + Number(balance.quantity || 0));
    }

    return map;
  }, [data.stock_balances]);

  // Helper to compute available stocks
  const getBookTotalStock = (bookId: string) => {
    return stockByBookId.get(bookId) || 0;
  };
  // Generate Report Data based on Selection
  const generateReportRows = () => {
    switch (selectedReportId) {
      case "1": { // Stock Entry Register
        return data.stock_entries
          .filter(e => filterByDate(e.date) && (!filterBook || e.book_id === filterBook) && (!filterLocation || e.location_id === filterLocation))
          .map(e => {
            const book = data.books.find(b => b.id === e.book_id);
            const loc = data.locations.find(l => l.id === e.location_id);
            return {
              col1: new Date(e.date).toLocaleDateString(),
              col2: e.entry_number,
              col3: book?.title || "N/A",
              col4: loc?.name || "N/A",
              col5: `${e.quantity} Units`,
              col6: `${e.unit_cost} PKR`,
              col7: `${e.quantity * e.unit_cost} PKR`,
              col8: e.reference_number || "-"
            };
          });
      }
      case "2": { // Sales Register
        return data.sales
          .filter(s => filterByDate(s.date) && (!filterLocation || s.location_id === filterLocation))
          .flatMap(s => {
            const items = data.sale_items.filter(si => si.sale_id === s.id);
            return items
              .filter(si => !filterBook || si.book_id === filterBook)
              .map(si => {
                const book = data.books.find(b => b.id === si.book_id);
                const loc = data.locations.find(l => l.id === s.location_id);
                return {
                  col1: new Date(s.date).toLocaleDateString(),
                  col2: s.sale_number,
                  col3: s.customer_name || "Walk-In Customer",
                  col4: loc?.name || "N/A",
                  col5: book?.title || "N/A",
                  col6: `${si.quantity} Pcs`,
                  col7: `${si.unit_price} PKR`,
                  col8: `${si.line_total} PKR (${s.payment_method})`
                };
              });
          });
      }
      case "3": { // Customer Return Register
        return data.customer_returns
          .filter(r => filterByDate(r.date) && (!filterBook || r.book_id === filterBook) && (!filterLocation || r.location_id === filterLocation))
          .map(r => {
            const book = data.books.find(b => b.id === r.book_id);
            const loc = data.locations.find(l => l.id === r.location_id);
            return {
              col1: new Date(r.date).toLocaleDateString(),
              col2: r.return_number,
              col3: r.customer_name || "-",
              col4: loc?.name || "-",
              col5: book?.title || "N/A",
              col6: `${r.quantity} Pcs`,
              col7: r.reason,
              col8: r.notes || "-"
            };
          });
      }
      case "4": { // Publisher Return Register
        return data.publisher_returns
          .filter(r => filterByDate(r.date) && (!filterBook || r.book_id === filterBook) && (!filterLocation || r.location_id === filterLocation) && (!filterPublisher || r.publisher_id === filterPublisher))
          .map(r => {
            const pub = data.publishers.find(p => p.id === r.publisher_id);
            const book = data.books.find(b => b.id === r.book_id);
            const loc = data.locations.find(l => l.id === r.location_id);
            return {
              col1: new Date(r.date).toLocaleDateString(),
              col2: r.return_number,
              col3: pub?.publisher_name || "N/A",
              col4: loc?.name || "N/A",
              col5: book?.title || "N/A",
              col6: `${r.quantity} Pcs`,
              col7: r.reason,
              col8: r.notes || "-"
            };
          });
      }
      case "5": { // Stock Transfer Register
        return data.stock_transfers
          .filter(t => filterByDate(t.date) && (!filterBook || t.book_id === filterBook) && (!filterLocation || t.from_location_id === filterLocation || t.to_location_id === filterLocation))
          .map(t => {
            const book = data.books.find(b => b.id === t.book_id);
            const fromLoc = data.locations.find(l => l.id === t.from_location_id);
            const toLoc = data.locations.find(l => l.id === t.to_location_id);
            return {
              col1: new Date(t.date).toLocaleDateString(),
              col2: t.transfer_number,
              col3: book?.title || "N/A",
              col4: fromLoc?.name || "N/A",
              col5: toLoc?.name || "N/A",
              col6: `${t.quantity} Pcs`,
              col7: t.notes || "-",
              col8: "COMPLETED"
            };
          });
      }
      case "6": { // Damage/Loss Register
        return data.damage_loss_records
          .filter(d => filterByDate(d.date) && (!filterBook || d.book_id === filterBook) && (!filterLocation || d.location_id === filterLocation))
          .map(d => {
            const book = data.books.find(b => b.id === d.book_id);
            const loc = data.locations.find(l => l.id === d.location_id);
            return {
              col1: new Date(d.date).toLocaleDateString(),
              col2: d.reason,
              col3: book?.title || "N/A",
              col4: loc?.name || "N/A",
              col5: `${d.quantity} Units`,
              col6: d.notes || "-",
              col7: "",
              col8: ""
            };
          });
      }
      case "7": { // Available Stock Report
        return data.books
          .map(b => ({ b, stock: getBookTotalStock(b.id) }))
          .filter(({ b, stock }) => stock > b.reorder_level && (!filterPublisher || b.publisher_id === filterPublisher) && (!filterBook || b.id === filterBook))
          .map(({ b, stock }) => {
            const pub = data.publishers.find(p => p.id === b.publisher_id)?.publisher_name || "N/A";
            return {
              col1: b.book_number,
              col2: b.title,
              col3: pub,
              col4: `${b.purchase_cost} PKR`,
              col5: `${b.sale_price} PKR`,
              col6: `${stock} Units`,
              col7: `${stock * b.purchase_cost} PKR`,
              col8: "In Stock"
            };
          });
      }
      case "8": { // Low Stock Report
        return data.books
          .map(b => ({ b, stock: getBookTotalStock(b.id) }))
          .filter(({ b, stock }) => stock > 0 && stock <= b.reorder_level && (!filterPublisher || b.publisher_id === filterPublisher) && (!filterBook || b.id === filterBook))
          .map(({ b, stock }) => {
            const pub = data.publishers.find(p => p.id === b.publisher_id)?.publisher_name || "N/A";
            return {
              col1: b.book_number,
              col2: b.title,
              col3: pub,
              col4: `${stock} Units`,
              col5: `Threshold: ${b.reorder_level}`,
              col6: `${b.purchase_cost} PKR`,
              col7: `${stock * b.purchase_cost} PKR`,
              col8: "LOW MARGIN"
            };
          });
      }
      case "9": { // Out of Stock Report
        return data.books
          .map(b => ({ b, stock: getBookTotalStock(b.id) }))
          .filter(({ b, stock }) => stock === 0 && (!filterPublisher || b.publisher_id === filterPublisher) && (!filterBook || b.id === filterBook))
          .map(({ b }) => {
            const pub = data.publishers.find(p => p.id === b.publisher_id)?.publisher_name || "N/A";
            return {
              col1: b.book_number,
              col2: b.title,
              col3: pub,
              col4: "0 Units",
              col5: `${b.purchase_cost} PKR`,
              col6: `${b.sale_price} PKR`,
              col7: "-",
              col8: "OUT"
            };
          });
      }
      case "10": { // Publisher-wise Stock Report
        return data.publishers
          .filter(p => !filterPublisher || p.id === filterPublisher)
          .map(p => {
            const pubBooks = data.books.filter(b => b.publisher_id === p.id);
            const totalItems = pubBooks.length;
            const totalStock = pubBooks.reduce((sum, b) => sum + getBookTotalStock(b.id), 0);
            const totalCostValue = pubBooks.reduce((sum, b) => sum + (getBookTotalStock(b.id) * b.purchase_cost), 0);
            return {
              col1: p.publisher_number,
              col2: p.publisher_name,
              col3: `${totalItems} Titles`,
              col4: `${totalStock} Units`,
              col5: `${totalCostValue} PKR`,
              col6: p.contact_person || "-",
              col7: p.phone || "-",
              col8: ""
            };
          });
      }
      case "11": { // Subject-wise Stock Report
        return data.subjects.map(s => {
          const subBooks = data.books.filter(b => b.subject_id === s.id);
          const totalStock = subBooks.reduce((sum, b) => sum + getBookTotalStock(b.id), 0);
          const totalValue = subBooks.reduce((sum, b) => sum + (getBookTotalStock(b.id) * b.purchase_cost), 0);
          return {
            col1: s.id,
            col2: s.name,
            col3: `${subBooks.length} Registered books`,
            col4: `${totalStock} Copies`,
            col5: `${totalValue} PKR Asset Value`,
            col6: "",
            col7: "",
            col8: ""
          };
        });
      }
      case "12": { // Class-wise Stock Report
        return data.classes.map(c => {
          const clsBooks = data.books.filter(b => b.class_id === c.id);
          const totalStock = clsBooks.reduce((sum, b) => sum + getBookTotalStock(b.id), 0);
          const totalValue = clsBooks.reduce((sum, b) => sum + (getBookTotalStock(b.id) * b.purchase_cost), 0);
          return {
            col1: c.id,
            col2: c.name,
            col3: `${clsBooks.length} Books`,
            col4: `${totalStock} Copies`,
            col5: `${totalValue} PKR Value`,
            col6: "",
            col7: "",
            col8: ""
          };
        });
      }
      case "13": { // Location-wise Stock Report
        return data.locations
          .filter(l => !filterLocation || l.id === filterLocation)
          .map(l => {
            const locBalances = data.stock_balances.filter(b => b.location_id === l.id);
            const totalQty = locBalances.reduce((sum, b) => sum + b.quantity, 0);
            const totalVal = locBalances.reduce((sum, b) => {
              const book = data.books.find(bk => bk.id === b.book_id);
              return sum + (b.quantity * (book?.purchase_cost || 0));
            }, 0);
            return {
              col1: l.code,
              col2: l.name,
              col3: l.type.toUpperCase(),
              col4: `${totalQty} Units`,
              col5: `${totalVal} PKR`,
              col6: l.city || "-",
              col7: l.contact_person || "-",
              col8: l.status.toUpperCase()
            };
          });
      }
      case "14": { // Book-wise Stock History
        const filteredHistory = data.stock_history.filter(h => 
          (!filterBook || h.book_id === filterBook) && 
          (!filterLocation || h.location_id === filterLocation) &&
          filterByDate(h.date)
        );
        return filteredHistory.map(h => {
          const book = data.books.find(b => b.id === h.book_id);
          const loc = data.locations.find(l => l.id === h.location_id);
          return {
            col1: new Date(h.date).toLocaleDateString(),
            col2: book?.title || "N/A",
            col3: loc?.name || "N/A",
            col4: h.movement_type,
            col5: h.quantity_in > 0 ? `+${h.quantity_in}` : "-",
            col6: h.quantity_out > 0 ? `-${h.quantity_out}` : "-",
            col7: `${h.balance_after} Units`,
            col8: h.reference_number || "-"
          };
        });
      }
      case "15": { // Monthly Stock In/Out Report
        const monthlyGroups: Record<string, { in: number, out: number }> = {};
        data.stock_history.forEach(h => {
          const key = h.date.substring(0, 7); // YYYY-MM
          if (!monthlyGroups[key]) monthlyGroups[key] = { in: 0, out: 0 };
          monthlyGroups[key].in += h.quantity_in;
          monthlyGroups[key].out += h.quantity_out;
        });

        return Object.entries(monthlyGroups)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([month, flow]) => ({
            col1: month,
            col2: "Book Stocks Movement Summary",
            col3: `Total Stock Added: ${flow.in} units`,
            col4: `Total Sold / Distributed: ${flow.out} units`,
            col5: `Net Change: ${flow.in - flow.out} units`,
            col6: "",
            col7: "",
            col8: ""
          }));
      }
      case "16": { // Stock Value Report
        return data.books
          .filter(b => (!filterBook || b.id === filterBook) && (!filterPublisher || b.publisher_id === filterPublisher))
          .map(b => {
            const stock = getBookTotalStock(b.id);
            const costVal = stock * b.purchase_cost;
            const retailVal = stock * b.sale_price;
            const potentialProfit = retailVal - costVal;

            return {
              col1: b.book_number,
              col2: b.title,
              col3: `${stock} Copies`,
              col4: `${b.purchase_cost} PKR`,
              col5: `${costVal} PKR`,
              col6: `${b.sale_price} PKR`,
              col7: `${retailVal} PKR`,
              col8: `Margin: ${potentialProfit} PKR`
            };
          });
      }
      default:
        return [];
    }
  };

    const rows = useMemo(() => {
    const generatedRows = generateReportRows();

    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return generatedRows;
    }

    return generatedRows.filter((row) => {
      return [
        row.col1,
        row.col2,
        row.col3,
        row.col4,
        row.col5,
        row.col6,
        row.col7,
        row.col8,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [
    selectedReportId,
    startDate,
    endDate,
    searchQuery,
    filterPublisher,
    filterBook,
    filterLocation,
    data.stock_entries,
    data.sales,
    data.sale_items,
    data.customer_returns,
    data.publisher_returns,
    data.stock_transfers,
    data.damage_loss_records,
    data.stock_balances,
    data.stock_history,
    data.books,
    data.publishers,
    data.locations,
    data.subjects,
    data.classes,
    stockByBookId,
  ]);

  const visibleRows = useMemo(() => {
    return rows.slice(0, MAX_RENDERED_ROWS);
  }, [rows]);

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  // Export CSV
  const handleExportCSV = () => {
    const reportName = reports.find(r => r.id === selectedReportId)?.name || "Report";
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Report: ${reportName}\r\n`;
    csvContent += `Date Filter: ${startDate || "Any"} to ${endDate || "Any"}\r\n\r\n`;

    // Dynamic headers
    csvContent += headers.map(h => `"${h}"`).join(",") + "\r\n";

    rows.forEach(r => {
      const row = `"${r.col1}","${r.col2}","${r.col3}","${r.col4}","${r.col5}","${r.col6}","${r.col7}","${r.col8}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportName.toLowerCase().replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const handleExportPDF = () => {
    const reportName = reports.find(r => r.id === selectedReportId)?.name || "Report";
    const cols = headers.map((header, idx) => ({
  header,
  dataKey: `col${idx + 1}` as keyof ReportRow,
}));
    // Filter out empty headers
    const validCols = cols.filter(col => col.header.trim() !== "");

    // Format rows to match the dynamic column keys
    const pdfRows = rows.map((r) => {
  const rowObj: Record<string, string | number> = {};

  validCols.forEach((col) => {
    rowObj[String(col.dataKey)] = r[col.dataKey] ?? "";
  });

  return rowObj;
});

    exportToPDF({
      title: reportName,
      subtitle: `Date Range: ${startDate || "All"} to ${endDate || "All"}`,
      columns: validCols,
      rows: pdfRows,
      fileName: `${reportName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    });
  };

  return (
    <div id="reports-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-500" />
            <span>Reports & Registers Portal</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Generate, print, and export 16 distinct business ledgers and stock catalogs in real-time.
          </p>
        </div>

        <div className="flex gap-2 text-xs font-bold">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-rose-500" />
            <span>Print Current Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" />
            <span>Export CSV Sheet</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROL HUB */}
      <div className="glass-panel border border-white/60 rounded-2xl p-5 space-y-4 no-print shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Select Report Type</label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              {reports.map(r => (
                <option key={r.id} value={r.id}>{r.id}. {r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Search Query</label>
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Title, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-0 text-slate-700 font-semibold focus:ring-0 focus:outline-none w-full text-xs"
              />
            </div>
          </div>

        </div>

        {/* CONDITIONAL ADVANCED FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-100">
          
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Filter Publisher</label>
            <select
              value={filterPublisher}
              onChange={(e) => setFilterPublisher(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">-- All Publishers --</option>
              {data.publishers.map(p => (
                <option key={p.id} value={p.id}>{p.publisher_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Filter Specific Book</label>
            <select
              value={filterBook}
              onChange={(e) => setFilterBook(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">-- All Books --</option>
              {data.books.map(b => (
                <option key={b.id} value={b.id}>{b.title} ({b.book_number})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Filter Storage Node</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">-- All Locations --</option>
              {data.locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* PRINT BANNER DESCRIPTION */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
        <div className="p-2.5 bg-white rounded-xl text-rose-500 border border-slate-200/60 shadow-sm">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-slate-800 font-bold text-xs">
            {reports.find(r => r.id === selectedReportId)?.name}
          </h3>
          <p className="text-slate-400 text-[10px] mt-0.5 font-bold">
            {reports.find(r => r.id === selectedReportId)?.desc}
          </p>
        </div>
      </div>

            {rows.length > MAX_RENDERED_ROWS && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 no-print">
          Showing first {MAX_RENDERED_ROWS} rows on screen for better speed. Export CSV/PDF still includes all {rows.length} rows.
        </div>
      )}

      {/* REPORT OUTPUT GRID */}
      <div className="glass-panel border border-white/60 rounded-2xl overflow-hidden print:bg-white print:border-none print:text-black shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 print:text-black">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider font-bold border-b border-slate-100 print:bg-slate-100 print:text-black">
              <tr>
                {headers.map((hdr, hIdx) => (
                  <th key={hIdx} className="px-5 py-3.5">{hdr}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200 bg-white/40">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-mono">
                    No rows returned under these criteria. Try changing filters or shifting parameters.
                  </td>
                </tr>
              ) : (
                                visibleRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/40">
                    <td className="px-5 py-3.5 font-bold text-[11px] text-slate-400">{row.col1}</td>
                    <td className="px-5 py-3.5 text-slate-800 print:text-black font-extrabold">{row.col2}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-bold">{row.col3}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{row.col4}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-mono font-bold">{row.col5}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-mono font-bold">{row.col6}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-mono font-bold">{row.col7}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-[10px] font-bold">{row.col8}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
