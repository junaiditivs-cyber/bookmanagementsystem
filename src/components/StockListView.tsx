import React, { useState } from "react";
import { 
  Search, Eye, Printer, Download, Plus, ArrowLeftRight, ShoppingCart, 
  RotateCcw, History, AlertTriangle, ShieldCheck, HelpCircle, Layers, Bookmark, Tags, Users, X, Sliders
} from "lucide-react";
import { DatabaseSchema, Book } from "../types";

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
    <div id="stock-list-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-rose-500" />
            <span>Real-time Book Inventories</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            View available balances, value holding, and statuses segmented by Warehouses, Retail Shops, and School locations.
          </p>
        </div>

        <div className="flex gap-2 text-xs self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all border border-slate-200 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print List</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 btn-premium-pink text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-white/95" />
            <span>Export Stock CSV</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="glass-panel border border-white/60 rounded-2xl p-4 space-y-3 no-print shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
          <Sliders className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-800">Filter Stock Records</span>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search book title, stock code, barcode, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-0 text-slate-700 font-medium text-xs focus:ring-0 focus:outline-none w-full"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
          <div>
            <select
              value={filterPublisher}
              onChange={(e) => setFilterPublisher(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
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
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
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
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
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
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
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
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
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
              className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 font-bold rounded-xl transition-all cursor-pointer border border-slate-200 text-center"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* STOCKS TABLE */}
      <div className="glass-panel rounded-2xl border border-white/60 overflow-hidden shadow-sm print:bg-white print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 print:text-black">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider border-b border-slate-100 font-mono print:bg-slate-100 print:text-black">
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
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
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
                    <tr key={book.id} className="hover:bg-white/40 transition-colors print:hover:bg-transparent">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-400 text-[10px]">{book.book_number}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 max-w-[150px] truncate" title={book.title}>
                        {book.title}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-medium truncate max-w-[100px]">{pubName}</td>
                      <td className="px-4 py-3.5 text-slate-500">{catName}</td>
                      <td className="px-4 py-3.5 text-slate-500">{subName}</td>
                      <td className="px-4 py-3.5 text-slate-500">{clsName}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium">PKR {book.purchase_cost}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-rose-600 font-bold print:text-black">PKR {book.sale_price}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400">{whStock}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400">{shopStock}</td>
                      <td className="px-3 py-3.5 text-center font-mono text-slate-400">{schStock}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900 bg-slate-50/50">{totalStock}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-extrabold text-slate-900 bg-slate-50/50">PKR {totalValue.toLocaleString()}</td>
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
                            className="p-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg hover:text-rose-500 transition-colors border border-slate-200 cursor-pointer"
                            title="Add stock"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canSell && (
                          <button
                            onClick={() => onTriggerSell(book.id)}
                            className="p-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg hover:text-emerald-500 transition-colors border border-slate-200 cursor-pointer"
                            title="Sell book"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canReturns && (
                          <>
                            <button
                              onClick={() => onTriggerCustomerReturn(book.id)}
                              className="p-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg hover:text-indigo-500 transition-colors border border-slate-200 cursor-pointer"
                              title="Customer return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onTriggerPublisherReturn(book.id)}
                              className="p-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg hover:text-amber-500 transition-colors border border-slate-200 cursor-pointer"
                              title="Return to publisher"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedBookHistory(book)}
                          className="p-1 bg-white hover:bg-slate-50 text-slate-600 rounded-lg hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/60 rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col shadow-2xl h-[550px] bg-white">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Stock Ledger: {selectedBookHistory.title} ({selectedBookHistory.book_number})
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Complete historical ledger tracking of every transaction, addition, sale, and return.
                </p>
              </div>
              <button 
                onClick={() => setSelectedBookHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider font-mono border-b border-slate-100 font-bold">
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
                <tbody className="divide-y divide-slate-100">
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
                          <tr key={h.id} className="hover:bg-slate-50/50">
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

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedBookHistory(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}