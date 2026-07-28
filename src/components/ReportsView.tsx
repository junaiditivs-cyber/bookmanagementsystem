import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Calendar,
  Database,
  Download,
  FileText,
  Filter,
  Printer,
  Search,
  type LucideIcon,
} from "lucide-react";
import { DatabaseSchema } from "../types";
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

const MAX_RENDERED_ROWS = 150;

export default function ReportsView({ data }: ReportsViewProps) {
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

  const selectedReport =
    reports.find((report) => report.id === selectedReportId) ||
    reports[0];

  const activeFilterCount = [
    startDate,
    endDate,
    searchQuery.trim(),
    filterPublisher,
    filterBook,
    filterLocation,
  ].filter(Boolean).length;

  return (
    <div
      id="reports-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{`
        #reports-view .reports-readable {
          color: #0f172a !important;
        }

        #reports-view .reports-muted {
          color: #475569 !important;
        }

        #reports-view .reports-panel {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 20px 55px rgba(15, 23, 42, 0.12) !important;
        }

        #reports-view .reports-soft-panel {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        #reports-view .reports-control {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        #reports-view .reports-control::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        #reports-view table {
          color: #334155 !important;
        }

        #reports-view thead {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          border-color: #cbd5e1 !important;
        }

        #reports-view tbody {
          background-color: #ffffff !important;
        }

        #reports-view tbody tr {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }

        #reports-view tbody tr:hover {
          background-color: #fffbeb !important;
        }

        #reports-view td,
        #reports-view th {
          border-color: #e2e8f0 !important;
        }

        html.dark #reports-view .reports-readable {
          color: #f8fafc !important;
        }

        html.dark #reports-view .reports-muted {
          color: #cbd5e1 !important;
        }

        html.dark #reports-view .reports-panel {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
          box-shadow: 0 26px 78px rgba(0, 0, 0, 0.44) !important;
        }

        html.dark #reports-view .reports-soft-panel {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #reports-view .reports-control {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
          color: #ffffff !important;
        }

        html.dark #reports-view .reports-control::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        html.dark #reports-view option {
          background-color: #0f2236 !important;
          color: #ffffff !important;
        }

        html.dark #reports-view table {
          color: #e2e8f0 !important;
        }

        html.dark #reports-view thead {
          background-color: #10263c !important;
          color: #cbd5e1 !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        html.dark #reports-view tbody {
          background-color: #081827 !important;
        }

        html.dark #reports-view tbody tr {
          background-color: #081827 !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #reports-view tbody tr:hover {
          background-color: #10263c !important;
        }

        html.dark #reports-view td,
        html.dark #reports-view th {
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        @media print {
          #reports-view {
            background: #ffffff !important;
            color: #000000 !important;
          }

          #reports-view .no-print {
            display: none !important;
          }

          #reports-view .reports-panel,
          #reports-view .reports-soft-panel,
          #reports-view table,
          #reports-view thead,
          #reports-view tbody,
          #reports-view tbody tr {
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }

          #reports-view td,
          #reports-view th,
          #reports-view p,
          #reports-view span,
          #reports-view h1,
          #reports-view h2,
          #reports-view h3 {
            color: #000000 !important;
            border-color: #cbd5e1 !important;
          }

          #reports-view .report-output {
            border: 0 !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <section
        className="
          relative overflow-hidden rounded-[2rem]
          border border-amber-300 bg-white px-6 py-6
          shadow-[0_20px_60px_rgba(15,23,42,0.12)]
          dark:border-amber-300/20 dark:bg-[#081827]
          dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]
          sm:px-8 sm:py-7 no-print
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.09),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.13),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                grid h-14 w-14 shrink-0 place-items-center
                rounded-2xl border border-amber-300
                bg-amber-50 text-amber-800
                shadow-[0_12px_28px_rgba(180,123,24,0.16)]
                dark:border-amber-300/25
                dark:bg-amber-300/10 dark:text-amber-300
              "
            >
              <FileText className="h-7 w-7" />
            </div>

            <div>
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300 bg-amber-50 px-3 py-1
                  text-[9px] font-black uppercase
                  tracking-[0.22em] text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-200
                "
              >
                <Database className="h-3.5 w-3.5" />
                16 live business reports
              </div>

              <h1 className="reports-readable mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Reports &amp; Registers Portal
              </h1>

              <p className="reports-muted mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Generate, search, print, and export complete stock,
                sales, return, transfer, valuation, and audit
                registers from live system records.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handlePrint}
              className="
                inline-flex items-center justify-center gap-2
                rounded-2xl border border-slate-300
                bg-white px-4 py-3 text-xs font-extrabold
                text-slate-800 shadow-sm transition
                hover:-translate-y-0.5 hover:border-amber-300
                hover:bg-amber-50 hover:text-amber-900
                dark:border-white/15 dark:bg-[#10263c]
                dark:text-slate-100
                dark:hover:border-amber-300/30
                dark:hover:bg-amber-300/10
                dark:hover:text-amber-200
              "
            >
              <Printer className="h-4 w-4" />
              Print Current Report
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="
                inline-flex items-center justify-center gap-2
                rounded-2xl border border-slate-300
                bg-white px-4 py-3 text-xs font-extrabold
                text-slate-800 shadow-sm transition
                hover:-translate-y-0.5 hover:border-emerald-300
                hover:bg-emerald-50 hover:text-emerald-800
                dark:border-white/15 dark:bg-[#10263c]
                dark:text-slate-100
                dark:hover:border-emerald-400/30
                dark:hover:bg-emerald-400/10
                dark:hover:text-emerald-200
              "
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="
                inline-flex items-center justify-center gap-2
                rounded-2xl border border-amber-400
                bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
                px-4 py-3 text-xs font-extrabold
                text-slate-950
                shadow-[0_12px_28px_rgba(180,123,24,0.22)]
                transition hover:-translate-y-0.5
                hover:brightness-105
                dark:border-amber-300/40
                dark:text-[#081827]
              "
            >
              <FileText className="h-4 w-4" />
              Export Full PDF
            </button>
          </div>
        </div>
      </section>

      <section
        className="
          reports-panel space-y-5 rounded-[2rem]
          border border-slate-300 bg-white p-5
          shadow-[0_20px_55px_rgba(15,23,42,0.12)]
          dark:border-amber-300/20 dark:bg-[#081827]
          no-print sm:p-6
        "
      >
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
          <div
            className="
              grid h-10 w-10 place-items-center rounded-2xl
              border border-amber-300 bg-amber-50
              text-amber-800 dark:border-amber-300/25
              dark:bg-amber-300/10 dark:text-amber-300
            "
          >
            <Filter className="h-5 w-5" />
          </div>

          <div>
            <h2 className="reports-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
              Report Filters
            </h2>

            <p className="reports-muted text-xs font-semibold text-slate-600 dark:text-slate-400">
              Select the report and narrow the live record set.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReportField label="Select Report Type" icon={FileText}>
            <select
              value={selectedReportId}
              onChange={(event) =>
                setSelectedReportId(event.target.value)
              }
              className="reports-control h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.id}. {report.name}
                </option>
              ))}
            </select>
          </ReportField>

          <ReportField label="Start Date" icon={Calendar}>
            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="reports-control h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:[color-scheme:dark]"
            />
          </ReportField>

          <ReportField label="End Date" icon={Calendar}>
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="reports-control h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:[color-scheme:dark]"
            />
          </ReportField>

          <ReportField label="Search Query" icon={Search}>
            <div className="reports-control flex h-12 items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 shadow-sm dark:border-white/15 dark:bg-[#10263c]">
              <Search className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />

              <input
                type="text"
                placeholder="Title, code, reference..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className="w-full border-0 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:ring-0 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          </ReportField>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 dark:border-white/10 md:grid-cols-3">
          <ReportField label="Filter Publisher" icon={Database}>
            <select
              value={filterPublisher}
              onChange={(event) =>
                setFilterPublisher(event.target.value)
              }
              className="reports-control h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- All Publishers --</option>

              {data.publishers.map((publisher) => (
                <option
                  key={publisher.id}
                  value={publisher.id}
                >
                  {publisher.publisher_name}
                </option>
              ))}
            </select>
          </ReportField>

          <ReportField label="Filter Specific Book" icon={BookOpen}>
            <select
              value={filterBook}
              onChange={(event) =>
                setFilterBook(event.target.value)
              }
              className="reports-control h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- All Books --</option>

              {data.books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} ({book.book_number})
                </option>
              ))}
            </select>
          </ReportField>

          <ReportField label="Filter Storage Node" icon={Database}>
            <select
              value={filterLocation}
              onChange={(event) =>
                setFilterLocation(event.target.value)
              }
              className="reports-control h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- All Locations --</option>

              {data.locations.map((location) => (
                <option
                  key={location.id}
                  value={location.id}
                >
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </ReportField>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 no-print">
        <ReportMetric
          label="Selected Report"
          value={`#${selectedReport.id}`}
        />

        <ReportMetric
          label="Matched Rows"
          value={rows.length.toLocaleString()}
        />

        <ReportMetric
          label="Active Filters"
          value={activeFilterCount.toLocaleString()}
        />

        <ReportMetric
          label="PDF Export"
          value="Full Records"
        />
      </div>

      <section
        className="
          reports-soft-panel flex flex-col gap-4
          rounded-[2rem] border border-slate-200
          bg-slate-50 p-5 dark:border-white/10
          dark:bg-[#10263c] sm:flex-row
          sm:items-center sm:justify-between
        "
      >
        <div className="flex items-start gap-3">
          <div
            className="
              grid h-11 w-11 shrink-0 place-items-center
              rounded-2xl border border-amber-300
              bg-white text-amber-800 shadow-sm
              dark:border-amber-300/25
              dark:bg-amber-300/10 dark:text-amber-300
            "
          >
            <BookOpen className="h-5 w-5" />
          </div>

          <div>
            <h3 className="reports-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
              {selectedReport.name}
            </h3>

            <p className="reports-muted mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
              {selectedReport.desc}
            </p>
          </div>
        </div>

        <div className="reports-panel rounded-2xl border border-slate-300 bg-white px-4 py-3 text-right dark:border-white/15 dark:bg-[#081827]">
          <p className="reports-muted text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
            Date Coverage
          </p>

          <p className="reports-readable mt-1 font-mono text-xs font-extrabold text-slate-950 dark:text-white">
            {startDate || "All dates"} → {endDate || "All dates"}
          </p>
        </div>
      </section>

      {rows.length > MAX_RENDERED_ROWS && (
        <div
          className="
            rounded-2xl border border-amber-200
            bg-amber-50 px-5 py-4 text-xs
            font-bold leading-5 text-amber-800
            dark:border-amber-400/20
            dark:bg-amber-400/10
            dark:text-amber-200 no-print
          "
        >
          Screen performance ke liye pehli{" "}
          {MAX_RENDERED_ROWS} rows show ho rahi hain. CSV aur PDF
          export mein tamam {rows.length.toLocaleString()} filtered
          rows include hongi.
        </div>
      )}

      <section
        className="
          reports-panel report-output overflow-hidden
          rounded-[2rem] border border-slate-300
          bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)]
          dark:border-amber-300/20 dark:bg-[#081827]
          print:border-0 print:bg-white print:shadow-none
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-xs text-slate-700 dark:text-slate-200 print:min-w-0 print:text-black">
            <thead className="border-b border-slate-200 bg-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300 print:bg-slate-100 print:text-black">
              <tr>
                {headers.map((header, headerIndex) => (
                  <th
                    key={headerIndex}
                    className="whitespace-nowrap px-5 py-4"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-[#081827] print:divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="reports-muted py-14 text-center font-mono font-semibold text-slate-600 dark:text-slate-400"
                  >
                    No rows returned under these criteria. Change
                    the filters or select another report.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="bg-white transition-colors hover:bg-amber-50/70 dark:bg-[#081827] dark:hover:bg-[#10263c]"
                  >
                    <td className="reports-muted whitespace-nowrap px-5 py-4 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {row.col1}
                    </td>

                    <td className="reports-readable px-5 py-4 font-extrabold text-slate-950 dark:text-white print:text-black">
                      {row.col2}
                    </td>

                    <td className="reports-readable px-5 py-4 font-bold text-slate-800 dark:text-slate-100">
                      {row.col3}
                    </td>

                    <td className="reports-muted px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      {row.col4}
                    </td>

                    <td className="reports-readable whitespace-nowrap px-5 py-4 font-mono font-extrabold text-slate-900 dark:text-white">
                      {row.col5}
                    </td>

                    <td className="reports-readable whitespace-nowrap px-5 py-4 font-mono font-extrabold text-slate-900 dark:text-white">
                      {row.col6}
                    </td>

                    <td className="reports-readable whitespace-nowrap px-5 py-4 font-mono font-extrabold text-slate-900 dark:text-white">
                      {row.col7}
                    </td>

                    <td className="reports-muted px-5 py-4 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {row.col8}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ReportField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="reports-readable mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-slate-100">
        <Icon className="h-4 w-4 text-amber-700 dark:text-amber-300" />
        <span>{label}</span>
      </label>

      {children}
    </div>
  );
}

function ReportMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="reports-panel rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
      <p className="reports-muted text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
        {label}
      </p>

      <p className="reports-readable mt-2 break-words font-mono text-xl font-extrabold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}