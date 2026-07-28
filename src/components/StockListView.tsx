import React, { useState } from "react";
import { 
  Search, Eye, Printer, Download, Plus, ArrowLeftRight, ShoppingCart, 
  RotateCcw, History, AlertTriangle, ShieldCheck, HelpCircle, Layers, Bookmark, Tags, Users, X, Sliders
} from "lucide-react";
import { DatabaseSchema, Book } from "../types";

import ScreenModalPortal from "./ui/ScreenModalPortal";
interface StockListViewProps {
  data: DatabaseSchema;
  onNavigate: (page: string) => void;
  onTriggerSell: (bookId: string) => void;
  onTriggerCustomerReturn: (bookId: string) => void;
  onTriggerPublisherReturn: (bookId: string) => void;
  onTriggerAddStock: (bookId: string) => void;
  canAddStock?: boolean;
  canSell?: boolean;
  canReturns?: boolean;
}

export default function StockListView({
  data,
  onNavigate,
  onTriggerSell,
  onTriggerCustomerReturn,
  onTriggerPublisherReturn,
  onTriggerAddStock,
  canAddStock = false,
  canSell = false,
  canReturns = false,
}: StockListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Detailed Stock History Drawer for selected book
  const [selectedBookHistory, setSelectedBookHistory] = useState<Book | null>(null);

  // Helper to compute location stocks for a book
  const getBookStockDetails = (book: Book) => {
    // Warehouse stock
    const whLocations = data.locations.filter(l => l.type === "warehouse").map(l => l.id);
    const whStock = data.stock_balances
      .filter(b => b.book_id === book.id && whLocations.includes(b.location_id))
      .reduce((sum, b) => sum + b.quantity, 0);

    // Shop stock
    const shopLocations = data.locations.filter(l => l.type === "shop").map(l => l.id);
    const shopStock = data.stock_balances
      .filter(b => b.book_id === book.id && shopLocations.includes(b.location_id))
      .reduce((sum, b) => sum + b.quantity, 0);

    // School stock
    const schLocations = data.locations.filter(l => l.type === "school").map(l => l.id);
    const schStock = data.stock_balances
      .filter(b => b.book_id === book.id && schLocations.includes(b.location_id))
      .reduce((sum, b) => sum + b.quantity, 0);

    const totalStock = whStock + shopStock + schStock;
    const totalValue = totalStock * book.purchase_cost;

    let stockStatus: "Available" | "Low Stock" | "Out of Stock" = "Available";
    if (totalStock === 0) {
      stockStatus = "Out of Stock";
    } else if (totalStock <= book.reorder_level) {
      stockStatus = "Low Stock";
    }

    return { whStock, shopStock, schStock, totalStock, totalValue, stockStatus };
  };

  // Filter books
  const filteredBooks = data.books.filter(book => {
    const details = getBookStockDetails(book);

    const matchSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        book.book_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (book.ISBN && book.ISBN.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchPub = !filterPublisher || book.publisher_id === filterPublisher;
    const matchCat = !filterCategory || book.category_id === filterCategory;
    const matchSub = !filterSubject || book.subject_id === filterSubject;
    const matchCls = !filterClass || book.class_id === filterClass;
    
    let matchStatus = true;
    if (filterStatus) {
      matchStatus = details.stockStatus === filterStatus;
    }

    return matchSearch && matchPub && matchCat && matchSub && matchCls && matchStatus;
  });

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Book Code,Book Title,Publisher,Category,Subject,Class,Purchase Cost,Sale Price,Warehouse Stock,Shop Stock,School Stock,Total Stock,Stock Value,Reorder Level,Stock Status\r\n";

    filteredBooks.forEach(book => {
      const pub = data.publishers.find(p => p.id === book.publisher_id)?.publisher_name || "N/A";
      const cat = data.categories.find(c => c.id === book.category_id)?.name || "N/A";
      const sub = data.subjects.find(s => s.id === book.subject_id)?.name || "N/A";
      const cls = data.classes.find(c => c.id === book.class_id)?.name || "N/A";
      const details = getBookStockDetails(book);

      const row = `"${book.book_number}","${book.title.replace(/"/g, '""')}","${pub.replace(/"/g, '""')}","${cat}","${sub}","${cls}",${book.purchase_cost},${book.sale_price},${details.whStock},${details.shopStock},${details.schStock},${details.totalStock},${details.totalValue},${book.reorder_level},"${details.stockStatus}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `book_stock_list_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="stock-list-view" className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100">

      <style>{`
        #stock-list-view .stock-readable {
          color: #0f172a !important;
        }

        #stock-list-view .stock-muted {
          color: #475569 !important;
        }

        #stock-list-view .stock-panel {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 20px 55px rgba(15, 23, 42, 0.12) !important;
        }

        #stock-list-view .stock-soft-panel {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        #stock-list-view .stock-control {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        #stock-list-view .stock-control::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        #stock-list-view table {
          color: #334155 !important;
        }

        #stock-list-view thead {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          border-color: #cbd5e1 !important;
        }

        #stock-list-view tbody {
          background-color: #ffffff !important;
        }

        #stock-list-view tbody tr {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }

        #stock-list-view tbody tr:hover {
          background-color: #fffbeb !important;
        }

        #stock-list-view td,
        #stock-list-view th {
          border-color: #e2e8f0 !important;
        }

        #stock-list-view .stock-modal-header,
        #stock-list-view .stock-modal-footer {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        #stock-list-view .stock-modal-body {
          background-color: #ffffff !important;
          color: #334155 !important;
        }

        html.dark #stock-list-view .stock-readable {
          color: #f8fafc !important;
        }

        html.dark #stock-list-view .stock-muted {
          color: #cbd5e1 !important;
        }

        html.dark #stock-list-view .stock-panel {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
          box-shadow: 0 26px 78px rgba(0, 0, 0, 0.44) !important;
        }

        html.dark #stock-list-view .stock-soft-panel {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #stock-list-view .stock-control {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
          color: #ffffff !important;
        }

        html.dark #stock-list-view .stock-control::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        html.dark #stock-list-view option {
          background-color: #0f2236 !important;
          color: #ffffff !important;
        }

        html.dark #stock-list-view table {
          color: #e2e8f0 !important;
        }

        html.dark #stock-list-view thead {
          background-color: #10263c !important;
          color: #cbd5e1 !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        html.dark #stock-list-view tbody {
          background-color: #081827 !important;
        }

        html.dark #stock-list-view tbody tr {
          background-color: #081827 !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #stock-list-view tbody tr:hover {
          background-color: #10263c !important;
        }

        html.dark #stock-list-view td,
        html.dark #stock-list-view th {
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #stock-list-view .stock-modal-header,
        html.dark #stock-list-view .stock-modal-footer {
          background-color: #0d2135 !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #stock-list-view .stock-modal-body {
          background-color: #081827 !important;
          color: #e2e8f0 !important;
        }

        @media print {
          #stock-list-view,
          #stock-list-view .stock-panel,
          #stock-list-view table,
          #stock-list-view thead,
          #stock-list-view tbody,
          #stock-list-view tbody tr {
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }

          #stock-list-view td,
          #stock-list-view th {
            color: #000000 !important;
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-8 sm:py-7 no-print">
        <div>
          <h1 className="stock-readable flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
            <Eye className="h-6 w-6 text-amber-700 dark:text-amber-300" />
            <span>Real-time Book Inventories</span>
          </h1>
          <p className="stock-muted mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300 sm:text-sm">
            View available balances, value holding, and statuses segmented by Warehouses, Retail Shops, and School locations.
          </p>
        </div>

        <div className="flex gap-2 text-xs self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-100 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print List</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400 bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)] px-4 py-3 text-xs font-extrabold text-slate-950 shadow-[0_12px_28px_rgba(180,123,24,0.22)] transition hover:-translate-y-0.5 hover:brightness-105 dark:border-amber-300/40 dark:text-[#081827]"
          >
            <Download className="w-3.5 h-3.5 text-white/95" />
            <span>Export Stock CSV</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="stock-panel space-y-4 rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] no-print">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 dark:border-white/10">
          <Sliders className="w-4 h-4 text-rose-500" />
          <span className="stock-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">Filter Stock Records</span>
        </div>

        <div className="stock-soft-panel flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-[#10263c]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search book title, stock code, barcode, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-0 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:ring-0 dark:text-white dark:placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div>
            <select
              value={filterPublisher}
              onChange={(e) => setFilterPublisher(e.target.value)}
              className="stock-control h-11 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- All Publishers --</option>
              {data.publishers.map(p => (
                <option key={p.id} value={p.id}>{p.publisher_name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="stock-control h-11 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- All Categories --</option>
              {data.categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="stock-control h-11 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- All Subjects --</option>
              {data.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="stock-control h-11 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- All Classes --</option>
              {data.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="stock-control h-11 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
            >
              <option value="">-- Stock Alert Status --</option>
              <option value="Available">Available Only</option>
              <option value="Low Stock">Low Stock Alerts</option>
              <option value="Out of Stock">Out of Stock Only</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterPublisher("");
                setFilterCategory("");
                setFilterSubject("");
                setFilterClass("");
                setFilterStatus("");
              }}
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-xs font-extrabold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* STOCKS TABLE */}
      <div className="stock-panel overflow-hidden rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] print:bg-white print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-left text-xs text-slate-700 dark:text-slate-200 print:min-w-0 print:text-black">
            <thead className="border-b border-slate-200 bg-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300 print:bg-slate-100 print:text-black">
              <tr>
                <th className="px-4 py-3.5">Code</th>
                <th className="px-4 py-3.5">Book Title</th>
                <th className="px-4 py-3.5">Publisher</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Class</th>
                <th className="px-4 py-3.5 text-right">Cost</th>
                <th className="px-4 py-3.5 text-right">Price</th>
                <th className="px-3 py-3.5 text-center">Whouse</th>
                <th className="px-3 py-3.5 text-center">Shop</th>
                <th className="px-3 py-3.5 text-center">School</th>
                <th className="px-4 py-3.5 text-center font-bold bg-slate-100/40">Total Stock</th>
                <th className="px-4 py-3.5 text-right font-bold bg-slate-100/40">Stock Value</th>
                <th className="px-4 py-3.5 text-center no-print">Status</th>
                <th className="px-4 py-3.5 text-right no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-[#081827] print:divide-slate-200">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-slate-400 font-mono font-medium">
                    No books matching filters are currently found in database.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const pubName = data.publishers.find(p => p.id === book.publisher_id)?.publisher_name || "N/A";
                  const catName = data.categories.find(c => c.id === book.category_id)?.name || "N/A";
                  const subName = data.subjects.find(s => s.id === book.subject_id)?.name || "N/A";
                  const clsName = data.classes.find(c => c.id === book.class_id)?.name || "N/A";
                  const { whStock, shopStock, schStock, totalStock, totalValue, stockStatus } = getBookStockDetails(book);

                  return (
                    <tr key={book.id} className="bg-white transition-colors hover:bg-amber-50/70 dark:bg-[#081827] dark:hover:bg-[#10263c] print:hover:bg-transparent">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-400 text-[10px]">{book.book_number}</td>
                      <td className="stock-readable max-w-[180px] truncate px-4 py-3.5 font-extrabold text-slate-950 dark:text-white" title={book.title}>
                        {book.title}
                      </td>
                      <td className="stock-muted max-w-[120px] truncate px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">{pubName}</td>
                      <td className="stock-muted px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">{catName}</td>
                      <td className="stock-muted px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">{subName}</td>
                      <td className="stock-muted px-4 py-3.5 font-semibold text-slate-600 dark:text-slate-300">{clsName}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium">PKR {book.purchase_cost}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-rose-600 font-bold print:text-black">PKR {book.sale_price}</td>
                      <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{whStock}</td>
                      <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{shopStock}</td>
                      <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{schStock}</td>
                      <td className="stock-readable bg-slate-100 px-4 py-3.5 text-center font-mono font-extrabold text-slate-950 dark:bg-[#10263c] dark:text-white">{totalStock}</td>
                      <td className="stock-readable bg-slate-100 px-4 py-3.5 text-right font-mono font-extrabold text-slate-950 dark:bg-[#10263c] dark:text-white">PKR {totalValue.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-center no-print">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                          stockStatus === "Available" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                          stockStatus === "Low Stock" ? "bg-amber-50 text-amber-600 border-amber-200 animate-pulse" :
                          "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                          {stockStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1 no-print">
                        {canAddStock && (
                          <button
                            onClick={() => onTriggerAddStock(book.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-rose-400/30 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                            title="Add stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canSell && (
                          <button
                            onClick={() => onTriggerSell(book.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
                            title="Sell book"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canReturns && (
                          <>
                            <button
                              onClick={() => onTriggerCustomerReturn(book.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10 dark:hover:text-blue-200"
                              title="Customer return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onTriggerPublisherReturn(book.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
                              title="Return to publisher"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedBookHistory(book)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
                          title="Stock ledger"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SINGLE BOOK STOCK HISTORY MODAL */}
      {selectedBookHistory && (
        <ScreenModalPortal>
          <div className="stock-panel flex h-[min(720px,92vh)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-amber-300 bg-white shadow-[0_38px_125px_rgba(15,23,42,0.48)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_38px_125px_rgba(0,0,0,0.68)]">
            <div className="stock-modal-header flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-[#0d2135]">
              <div>
                <h2 className="stock-readable text-base font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Stock Ledger: {selectedBookHistory.title} ({selectedBookHistory.book_number})
                </h2>
                <p className="stock-muted mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-400">
                  Complete historical ledger tracking of every transaction, addition, sale, and return.
                </p>
              </div>
              <button 
                onClick={() => setSelectedBookHistory(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="stock-modal-body min-h-0 flex-1 overflow-auto bg-white p-6 text-slate-700 dark:bg-[#081827] dark:text-slate-200">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2.5">Date / Time</th>
                    <th className="px-4 py-2.5">Location</th>
                    <th className="px-4 py-2.5">Movement Type</th>
                    <th className="px-4 py-2.5 text-center">Qty In</th>
                    <th className="px-4 py-2.5 text-center">Qty Out</th>
                    <th className="px-4 py-2.5 text-center font-bold">Balance After</th>
                    <th className="px-4 py-2.5">Ref No.</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-[#081827]">
                  {data.stock_history.filter(h => h.book_id === selectedBookHistory.id).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-mono">
                        No historical movements registered for this book yet.
                      </td>
                    </tr>
                  ) : (
                    data.stock_history
                      .filter(h => h.book_id === selectedBookHistory.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(h => {
                        const locName = data.locations.find(l => l.id === h.location_id)?.name || "N/A";
                        return (
                          <tr key={h.id} className="bg-white transition hover:bg-amber-50/70 dark:bg-[#081827] dark:hover:bg-[#10263c]">
                            <td className="px-4 py-2.5 font-mono text-[10px] text-slate-500">
                              {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-2.5 text-slate-700 font-medium">{locName}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                h.movement_type === "Opening Stock" ? "bg-slate-100 text-slate-600 border-slate-200" :
                                h.movement_type === "Add Stock" || h.movement_type === "Transfer In" || h.movement_type === "Customer Return" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                "bg-rose-50 text-rose-600 border-rose-200"
                              }`}>
                                {h.movement_type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-600">{h.quantity_in > 0 ? `+${h.quantity_in}` : "-"}</td>
                            <td className="px-4 py-2.5 text-center font-mono font-bold text-rose-600">{h.quantity_out > 0 ? `-${h.quantity_out}` : "-"}</td>
                            <td className="px-4 py-2.5 text-center font-mono font-extrabold text-slate-800">{h.balance_after}</td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-indigo-500 font-bold">{h.reference_number || "-"}</td>
                            <td className="px-4 py-2.5 text-slate-400 max-w-[150px] truncate" title={h.notes}>{h.notes || "-"}</td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            <div className="stock-modal-footer flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-white/10 dark:bg-[#0d2135]">
              <button 
                onClick={() => setSelectedBookHistory(null)}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-xs font-extrabold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
              >
                Close History
              </button>
            </div>
          </div>
        </ScreenModalPortal>
      )}
    </div>
  );
}