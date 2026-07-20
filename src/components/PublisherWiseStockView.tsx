import React, { useState, useMemo } from "react";
import { DatabaseSchema, Book } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { 
  Users, Search, Printer, Download, Eye, BookOpen, AlertCircle, Package, Layers, Sparkles 
} from "lucide-react";

interface PublisherWiseStockViewProps {
  data: DatabaseSchema;
}

export default function PublisherWiseStockView({ data }: PublisherWiseStockViewProps) {
  const [selectedPublisher, setSelectedPublisher] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get active publishers
  const activePublishers = useMemo(() => {
    return data.publishers.filter(p => p.status === "active");
  }, [data.publishers]);

  // Compute stock levels per book
  const bookStockDetails = useMemo(() => {
    return data.books.map(book => {
      // Find subject name
      const subject = data.subjects.find(s => s.id === book.subject_id);
      // Find class name
      const classEntity = data.classes.find(c => c.id === book.class_id);
      // Find publisher name
      const publisher = data.publishers.find(p => p.id === book.publisher_id);

      // Compute stock quantity
      let qty = 0;
      data.stock_balances.forEach(sb => {
        if (sb.book_id === book.id) {
          if (!selectedLocation || sb.location_id === selectedLocation) {
            qty += sb.quantity;
          }
        }
      });

      const valueCost = qty * book.purchase_cost;
      const valueSale = qty * book.sale_price;
      const needsReorder = qty <= book.reorder_level;

      return {
        book,
        subjectName: subject?.name || "Unknown Subject",
        className: classEntity?.name || "Unknown Class",
        publisherName: publisher?.publisher_name || "Unknown Publisher",
        publisherId: book.publisher_id,
        qty,
        valueCost,
        valueSale,
        needsReorder
      };
    });
  }, [data.books, data.subjects, data.classes, data.publishers, data.stock_balances, selectedLocation]);

  // Filter book details based on selections
  const filteredBookStock = useMemo(() => {
    return bookStockDetails.filter(item => {
      if (selectedPublisher && item.publisherId !== selectedPublisher) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.book.title.toLowerCase().includes(query);
        const matchesCode = item.book.book_number.toLowerCase().includes(query);
        const matchesIsbn = (item.book.ISBN || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesCode && !matchesIsbn) return false;
      }
      return true;
    });
  }, [bookStockDetails, selectedPublisher, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalQty = 0;
    let totalCostVal = 0;
    let totalSaleVal = 0;
    let lowStockCount = 0;

    filteredBookStock.forEach(item => {
      totalQty += item.qty;
      totalCostVal += item.valueCost;
      totalSaleVal += item.valueSale;
      if (item.needsReorder) {
        lowStockCount += 1;
      }
    });

    return {
      totalQty,
      totalCostVal,
      totalSaleVal,
      lowStockCount,
      booksCount: filteredBookStock.length
    };
  }, [filteredBookStock]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const pubName = selectedPublisher ? (data.publishers.find(p => p.id === selectedPublisher)?.publisher_name || "") : "All Publishers";
    const locName = selectedLocation ? (data.locations.find(l => l.id === selectedLocation)?.name || "") : "All Locations";
    const title = `Publisher-wise Stock Audit Ledger - ${pubName}`;
    const subtitle = `Filter Constraints: Warehouse: ${locName} | Search Query: ${searchQuery || "None"}`;

    const cols = [
      { header: "Code", dataKey: "code" },
      { header: "Book Title", dataKey: "title" },
      { header: "Publisher", dataKey: "publisher" },
      { header: "Class / Subject", dataKey: "class_subject" },
      { header: "Stock Qty", dataKey: "qty" },
      { header: "Reorder", dataKey: "reorder" },
      { header: "Unit Cost", dataKey: "unit_cost" },
      { header: "Total Value", dataKey: "total_val" }
    ];

    const rows = filteredBookStock.map(item => ({
      code: item.book.book_number,
      title: item.book.title,
      publisher: item.publisherName,
      class_subject: `${item.className} - ${item.subjectName}`,
      qty: item.qty,
      reorder: item.needsReorder ? `YES (Min: ${item.book.reorder_level})` : "NO",
      unit_cost: `PKR ${item.book.purchase_cost}`,
      total_val: `PKR ${item.valueCost}`
    }));

    exportToPDF({
      title,
      subtitle,
      columns: cols,
      rows,
      summaryData: [
        { label: "Total Book Titles", value: summaryMetrics.booksCount },
        { label: "Total Units Available", value: summaryMetrics.totalQty },
        { label: "Aggregate Valuation (Cost)", value: `PKR ${summaryMetrics.totalCostVal.toLocaleString()}` }
      ],
      fileName: `PublisherWiseStock_${pubName.replace(/\s+/g, "_")}.pdf`
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* TITLE CONTAINER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 pb-5 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            <span>Publisher-wise Stock Explorer</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Analyze stock balances, evaluate liabilities, and run reorder projections segments by book publishers.
          </p>
        </div>

        <div className="flex gap-2 text-xs self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Ledger</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 btn-premium-pink text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-white/95" />
            <span>Export Audit PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="glass-panel border border-white/60 rounded-2xl p-5 space-y-4 no-print shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          
          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Publisher Account</label>
            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 font-bold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Publishers --</option>
              {activePublishers.map(p => (
                <option key={p.id} value={p.id}>{p.publisher_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Warehouse Location Node</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 font-bold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Locations --</option>
              {data.locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.type.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1.5">Keyword Search</label>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Title, Code or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-700 font-semibold focus:outline-none text-xs"
              />
            </div>
          </div>

        </div>
      </div>

      {/* METRIC CARD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Matched Titles</p>
          <p className="text-xl font-display font-bold text-slate-800 mt-1">{summaryMetrics.booksCount}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Under active publisher selection</div>
        </div>

        <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Stock Copies</p>
          <p className="text-xl font-display font-bold text-rose-600 mt-1">{summaryMetrics.totalQty.toLocaleString()}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Physical stock units</div>
        </div>

        <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Under Threshold</p>
          <p className="text-xl font-display font-bold text-amber-500 mt-1">{summaryMetrics.lowStockCount}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Syllabus reorder alerts</div>
        </div>

        <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Cost Value</p>
          <p className="text-sm font-bold text-slate-800 mt-2 truncate">PKR {summaryMetrics.totalCostVal.toLocaleString()}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Based on purchase costs</div>
        </div>

        <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">Retail Value</p>
          <p className="text-sm font-bold text-slate-800 mt-2 truncate">PKR {summaryMetrics.totalSaleVal.toLocaleString()}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Expected revenue value</div>
        </div>

      </div>

      {/* DETAIL STOCK TABLE */}
      <div className="glass-panel rounded-2xl border border-white/60 overflow-hidden shadow-sm">
        <div className="bg-white/80 px-5 py-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="font-display font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Detailed Publisher Stock Ledger</span>
          </span>
          <span className="text-slate-400 font-medium font-mono text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">Showing {filteredBookStock.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
              <tr>
                <th className="px-5 py-3">Book Code</th>
                <th className="px-5 py-3">Title Description</th>
                <th className="px-5 py-3">Publisher Account</th>
                <th className="px-5 py-3">Subject / Grade</th>
                <th className="px-5 py-3 text-center">Current Stock</th>
                <th className="px-5 py-3 text-center">Min Reorder</th>
                <th className="px-5 py-3 text-right">Cost Value</th>
                <th className="px-5 py-3 text-right">Potential Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookStock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-mono font-medium">
                    No books match the selected search and publisher filters.
                  </td>
                </tr>
              ) : (
                filteredBookStock.map(item => (
                  <tr key={item.book.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-400 text-[10px]">{item.book.book_number}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-800">{item.book.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{item.book.ISBN ? `ISBN: ${item.book.ISBN}` : ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-semibold">{item.publisherName}</td>
                    <td className="px-5 py-4 text-slate-600 font-bold">{item.className} - {item.subjectName}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        item.needsReorder 
                          ? "bg-rose-50 text-rose-600 border border-rose-100" 
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}>
                        {item.qty} units
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-slate-400 font-bold">
                      {item.book.reorder_level} units
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-800">
                      PKR {item.valueCost.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-slate-500 font-semibold">
                      PKR {item.valueSale.toLocaleString()}
                    </td>
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
