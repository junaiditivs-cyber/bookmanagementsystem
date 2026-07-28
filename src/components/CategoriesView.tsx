import React, { useState, useMemo } from "react";
import { DatabaseSchema, Category, Book } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { 
  Tags, Plus, Search, Edit2, ShieldAlert, X, RefreshCw, BookOpen, Package, 
  ArrowLeft, Download, Printer, CheckCircle, AlertTriangle, PlayCircle, Eye, Trash2
} from "lucide-react";
import { apiFetch } from "../api/http";

import ScreenModalPortal from "./ui/ScreenModalPortal";
interface CategoriesViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

async function getApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    return payload?.error || fallback;
  } catch {
    return fallback;
  }
}

export default function CategoriesView({ data, onRefresh, onShowNotification }: CategoriesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryStatus, setCategoryStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  // Drilldown states
  const [drilldownCategory, setDrilldownCategory] = useState<Category | null>(null);

  // --- DETAILED TRANSACTION COMPILATIONS PER BOOK ---
  const bookTransactionMetrics = useMemo(() => {
    const metrics = new Map<string, {
      warehouseStock: number;
      shopStock: number;
      schoolStock: number;
      totalStock: number;
      soldQty: number;
      customerReturnQty: number;
      publisherReturnQty: number;
      valueCost: number;
    }>();

    data.books.forEach(book => {
      // Stock balances
      let wh = 0;
      let shop = 0;
      let school = 0;

      data.stock_balances.forEach(sb => {
        if (sb.book_id === book.id) {
          const loc = data.locations.find(l => l.id === sb.location_id);
          if (loc) {
            if (loc.type === "warehouse") wh += sb.quantity;
            else if (loc.type === "shop") shop += sb.quantity;
            else if (loc.type === "school") school += sb.quantity;
          }
        }
      });

      const totalStock = wh + shop + school;

      // Sales qty
      let soldQty = 0;
      data.sale_items.forEach(si => {
        if (si.book_id === book.id) {
          soldQty += si.quantity;
        }
      });

      // Customer Returns
      let customerReturnQty = 0;
      data.customer_returns.forEach(cr => {
        if (cr.book_id === book.id) {
          customerReturnQty += cr.quantity;
        }
      });

      // Publisher Returns
      let publisherReturnQty = 0;
      data.publisher_returns.forEach(pr => {
        if (pr.book_id === book.id) {
          publisherReturnQty += pr.quantity;
        }
      });

      const valueCost = totalStock * book.purchase_cost;

      metrics.set(book.id, {
        warehouseStock: wh,
        shopStock: shop,
        schoolStock: school,
        totalStock,
        soldQty,
        customerReturnQty,
        publisherReturnQty,
        valueCost
      });
    });

    return metrics;
  }, [data.books, data.locations, data.stock_balances, data.sale_items, data.customer_returns, data.publisher_returns]);

  // --- STATS PER CATEGORY ---
  const categoryStats = useMemo(() => {
    const stats = new Map<string, {
      booksCount: number;
      totalStock: number;
      soldQty: number;
      customerReturnQty: number;
      publisherReturnQty: number;
      totalValueCost: number;
    }>();

    data.categories.forEach(s => {
      stats.set(s.id, {
        booksCount: 0,
        totalStock: 0,
        soldQty: 0,
        customerReturnQty: 0,
        publisherReturnQty: 0,
        totalValueCost: 0
      });
    });

    data.books.forEach(b => {
      const bMetrics = bookTransactionMetrics.get(b.id) || {
        warehouseStock: 0,
        shopStock: 0,
        schoolStock: 0,
        totalStock: 0,
        soldQty: 0,
        customerReturnQty: 0,
        publisherReturnQty: 0,
        valueCost: 0
      };

      const sStat = stats.get(b.category_id);
      if (sStat) {
        sStat.booksCount += 1;
        sStat.totalStock += bMetrics.totalStock;
        sStat.soldQty += bMetrics.soldQty;
        sStat.customerReturnQty += bMetrics.customerReturnQty;
        sStat.publisherReturnQty += bMetrics.publisherReturnQty;
        sStat.totalValueCost += bMetrics.valueCost;
      }
    });

    return stats;
  }, [data.categories, data.books, bookTransactionMetrics]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryStatus("active");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryStatus(category.status);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      onShowNotification("Category Name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : `/api/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName, status: categoryStatus })
      });

      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to save category record."));

      onShowNotification(
        editingCategory ? "Category updated successfully!" : "New category registered successfully!", 
        "success"
      );
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleDeactivate = async (category: Category) => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    try {
      const res = await apiFetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: category.name, status: newStatus })
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to change category status."));
      onShowNotification(`Category successfully ${newStatus === "active" ? "activated" : "deactivated"}.`, "success");
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    }
  };

  const handleDeleteCategory = async (subId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this category? This action cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/categories/${subId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete category.");
      }
      onShowNotification("Category deleted successfully!", "success");
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    }
  };

  // PDF Export of Category Overview
  const handleExportPDFAll = () => {
    const title = "Categories Inventory Audit & Valuation Ledger";
    const subtitle = `Generated Date: ${new Date().toLocaleDateString()}`;

    const cols = [
      { header: "Category Name", dataKey: "name" },
      { header: "Status", dataKey: "status" },
      { header: "Books Count", dataKey: "booksCount" },
      { header: "Stock Copies", dataKey: "stock" },
      { header: "Sold Qty", dataKey: "sold" },
      { header: "Customer Returns", dataKey: "cust_ret" },
      { header: "Publisher Returns", dataKey: "pub_ret" },
      { header: "Cost Valuation", dataKey: "value" }
    ];

    const rows = filteredCategories.map(s => {
      const stats = categoryStats.get(s.id) || { booksCount: 0, totalStock: 0, soldQty: 0, customerReturnQty: 0, publisherReturnQty: 0, totalValueCost: 0 };
      return {
        name: s.name,
        status: s.status.toUpperCase(),
        booksCount: stats.booksCount,
        stock: stats.totalStock,
        sold: stats.soldQty,
        cust_ret: stats.customerReturnQty,
        pub_ret: stats.publisherReturnQty,
        value: `PKR ${stats.totalValueCost.toLocaleString()}`
      };
    });

    exportToPDF({
      title,
      subtitle,
      columns: cols,
      rows,
      summaryData: [
        { label: "Total Categories", value: filteredCategories.length },
        { label: "Active Categories", value: filteredCategories.filter(s => s.status === "active").length }
      ],
      fileName: "Categories_Directory_Report.pdf"
    });
  };

  const filteredCategories = data.categories.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Drilldown calculations
  const drilldownBooks = useMemo(() => {
    if (!drilldownCategory) return [];
    return data.books.filter(b => b.category_id === drilldownCategory.id);
  }, [drilldownCategory, data.books]);

  return (
    <div id="categories-view" className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100">

      <style>{`
        #categories-view .categories-readable {
          color: #0f172a !important;
        }

        #categories-view .categories-muted {
          color: #475569 !important;
        }

        #categories-view .categories-panel {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          box-shadow: 0 20px 55px rgba(15, 23, 42, 0.12) !important;
        }

        #categories-view .categories-soft-panel {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        #categories-view .categories-control {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        #categories-view .categories-control::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        #categories-view table {
          color: #334155 !important;
        }

        #categories-view thead {
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          border-color: #cbd5e1 !important;
        }

        #categories-view tbody {
          background-color: #ffffff !important;
        }

        #categories-view tbody tr {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }

        #categories-view tbody tr:hover {
          background-color: #fffbeb !important;
        }

        #categories-view td,
        #categories-view th {
          border-color: #e2e8f0 !important;
        }

        html.dark #categories-view .categories-readable {
          color: #f8fafc !important;
        }

        html.dark #categories-view .categories-muted {
          color: #cbd5e1 !important;
        }

        html.dark #categories-view .categories-panel {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
          box-shadow: 0 26px 78px rgba(0, 0, 0, 0.44) !important;
        }

        html.dark #categories-view .categories-soft-panel {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #categories-view .categories-control {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
          color: #ffffff !important;
        }

        html.dark #categories-view .categories-control::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        html.dark #categories-view option {
          background-color: #0f2236 !important;
          color: #ffffff !important;
        }

        html.dark #categories-view table {
          color: #e2e8f0 !important;
        }

        html.dark #categories-view thead {
          background-color: #10263c !important;
          color: #cbd5e1 !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        html.dark #categories-view tbody {
          background-color: #081827 !important;
        }

        html.dark #categories-view tbody tr {
          background-color: #081827 !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #categories-view tbody tr:hover {
          background-color: #10263c !important;
        }

        html.dark #categories-view td,
        html.dark #categories-view th {
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        @media print {
          #categories-view,
          #categories-view .categories-panel,
          #categories-view .categories-soft-panel,
          #categories-view table,
          #categories-view thead,
          #categories-view tbody,
          #categories-view tbody tr {
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }

          #categories-view td,
          #categories-view th,
          #categories-view p,
          #categories-view span,
          #categories-view h1,
          #categories-view h2,
          #categories-view h3 {
            color: #000000 !important;
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      
      {/* 1. MASTER VIEW */}
      {!drilldownCategory ? (
        <>
          {/* HEADER */}
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-8 sm:py-7">
            <div>
              <h1 className="categories-readable flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                <Tags className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                <span>Inventory Categories Directory</span>
              </h1>
              <p className="categories-muted mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300 sm:text-sm">
                Configure school curriculum categories to segment books, check active stock, and print curriculum ledgers.
              </p>
            </div>

            <div className="flex gap-2 self-start sm:self-auto">
              <button
                onClick={handleExportPDFAll}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-100 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
              >
                <Download className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                <span>Export Catalog PDF</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400 bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)] px-5 py-3 text-xs font-extrabold text-slate-950 shadow-[0_12px_28px_rgba(180,123,24,0.22)] transition hover:-translate-y-0.5 hover:brightness-105 dark:border-amber-300/40 dark:text-[#081827]"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Category</span>
              </button>
            </div>
          </div>

          {/* FILTER & SEARCH */}
          <div className="categories-panel flex items-center gap-3 rounded-[2rem] border border-slate-300 bg-white px-5 py-4 text-xs shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
            <Search className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            <input
              type="text"
              placeholder="Search categories by name (e.g. Physics, Urdu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-0 bg-transparent text-sm font-bold text-slate-950 outline-none placeholder:text-slate-500 focus:ring-0 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          {/* CATEGORIES LIST TABLE */}
          <div className="categories-panel overflow-hidden rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-xs text-slate-700 dark:text-slate-200">
                <thead className="border-b border-slate-200 bg-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-3">Category ID</th>
                    <th className="px-5 py-3">Category Name</th>
                    <th className="px-5 py-3 text-center">Books Count</th>
                    <th className="px-5 py-3 text-center">In Stock</th>
                    <th className="px-5 py-3 text-center">Sold Qty</th>
                    <th className="px-5 py-3 text-right">Value (Cost)</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-[#081827]">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="categories-muted py-12 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                        No categories registered yet. Click "Add New Category" to organize syllabus records.
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map(category => {
                      const stats = categoryStats.get(category.id) || {
                        booksCount: 0,
                        totalStock: 0,
                        soldQty: 0,
                        customerReturnQty: 0,
                        publisherReturnQty: 0,
                        totalValueCost: 0
                      };
                      return (
                        <tr key={category.id} className="bg-white transition-colors hover:bg-amber-50/70 dark:bg-[#081827] dark:hover:bg-[#10263c]">
                          <td className="categories-muted px-5 py-4 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">{category.id}</td>
                          <td className="px-5 py-4">
                            <span className="categories-readable text-xs font-extrabold text-slate-950 dark:text-white sm:text-sm">{category.name}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold text-slate-700 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200">
                              {stats.booksCount} books
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                              {stats.totalStock.toLocaleString()} units
                            </span>
                          </td>
                          <td className="categories-muted px-5 py-4 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">
                            {stats.soldQty.toLocaleString()} units
                          </td>
                          <td className="categories-readable px-5 py-4 text-right font-mono font-extrabold text-slate-950 dark:text-white">
                            PKR {stats.totalValueCost.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-bold border ${
                              category.status === "active" 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                              {category.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-1.5">
                            <button
                              onClick={() => setDrilldownCategory(category)}
                              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-extrabold text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                              title="View Category Stock"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Stock</span>
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(category)} 
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
                              title="Edit Category"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {stats.booksCount === 0 ? (
                              <button 
                                onClick={() => handleDeleteCategory(category.id)} 
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 shadow-sm transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => toggleDeactivate(category)} 
                                className={`p-1.5 rounded-lg inline-flex transition-colors cursor-pointer border border-transparent ${
                                  category.status === "active"
                                    ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50/50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50"
                                }`}
                                title={category.status === "active" ? "Deactivate Category" : "Activate Category"}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        
        /* 2. CATEGORY DRILLDOWN VIEW */
        <div className="space-y-6 animate-fadeIn">
          
          {/* HEADER BACK BUTTON */}
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:flex sm:items-center sm:justify-between sm:gap-5 sm:px-8 sm:py-7">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrilldownCategory(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="categories-readable flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                  <Tags className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                  <span>Category Inventory: {drilldownCategory.name}</span>
                </h1>
                <p className="categories-muted mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300 sm:text-sm">
                  Detailed ledger breakdown of syllabus books, individual location balances, and total sales pipeline.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const title = `Category Inventory Detail Ledger - ${drilldownCategory.name}`;
                const cols = [
                  { header: "Book Title", dataKey: "title" },
                  { header: "Publisher", dataKey: "pub" },
                  { header: "Class", dataKey: "class" },
                  { header: "WH Qty", dataKey: "wh" },
                  { header: "Shop Qty", dataKey: "shop" },
                  { header: "School Qty", dataKey: "school" },
                  { header: "Total Avail", dataKey: "avail" },
                  { header: "Sold Qty", dataKey: "sold" },
                  { header: "Cust Returns", dataKey: "cust_ret" },
                  { header: "Pub Returns", dataKey: "pub_ret" }
                ];
                const rows = drilldownBooks.map(b => {
                  const m = bookTransactionMetrics.get(b.id) || {
                    warehouseStock: 0, shopStock: 0, schoolStock: 0, totalStock: 0, soldQty: 0, customerReturnQty: 0, publisherReturnQty: 0
                  };
                  return {
                    title: b.title,
                    pub: data.publishers.find(p => p.id === b.publisher_id)?.publisher_name || "Unknown",
                    class: data.classes.find(c => c.id === b.class_id)?.name || "Unknown",
                    wh: m.warehouseStock,
                    shop: m.shopStock,
                    school: m.schoolStock,
                    avail: m.totalStock,
                    sold: m.soldQty,
                    cust_ret: m.customerReturnQty,
                    pub_ret: m.publisherReturnQty
                  };
                });
                exportToPDF({
                  title,
                  subtitle: `Category: ${drilldownCategory.name} Ledger Details`,
                  columns: cols,
                  rows,
                  summaryData: [
                    { label: "Book Titles Count", value: drilldownBooks.length },
                    { label: "Aggregate Copies", value: drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.totalStock || 0), 0) }
                  ],
                  fileName: `Category_${drilldownCategory.name.replace(/\s+/g, "_")}_Details.pdf`
                });
              }}
              className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-100 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200 sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Details PDF</span>
            </button>
          </div>

          {/* SUMMARY CARDS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="categories-panel rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
              <p className="categories-muted text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Registered Titles</p>
              <p className="categories-readable mt-2 font-display text-2xl font-extrabold text-slate-950 dark:text-white">{drilldownBooks.length}</p>
              <div className="categories-muted mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">Under category {drilldownCategory.name}</div>
            </div>
            <div className="categories-panel rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
              <p className="categories-muted text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Current Stock Available</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                {drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.totalStock || 0), 0).toLocaleString()}
              </p>
              <div className="categories-muted mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">Combined locations inventory</div>
            </div>
            <div className="categories-panel rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
              <p className="categories-muted text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Accumulated Sales</p>
              <p className="mt-2 font-mono text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                {drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.soldQty || 0), 0).toLocaleString()}
              </p>
              <div className="categories-muted mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">Total sold copies</div>
            </div>
            <div className="categories-panel rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
              <p className="categories-muted text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">Asset Valuation</p>
              <p className="categories-readable mt-2 truncate font-mono text-base font-extrabold text-slate-950 dark:text-white">
                PKR {drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.valueCost || 0), 0).toLocaleString()}
              </p>
              <div className="categories-muted mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">Purchase cost cumulative</div>
            </div>
          </div>

          {/* DRILLDOWN DETAIL TABLE */}
          <div className="categories-panel overflow-hidden rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-800 dark:border-white/10 dark:bg-[#0d2135] dark:text-slate-200">
              <span className="categories-readable flex items-center gap-1.5 font-display font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                <span>Books Under {drilldownCategory.name}</span>
              </span>
              <span className="categories-muted rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-[10px] font-extrabold text-slate-600 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-300">Records: {drilldownBooks.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left text-xs text-slate-700 dark:text-slate-200">
                <thead className="border-b border-slate-200 bg-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Publisher</th>
                    <th className="px-5 py-3">Class/Category</th>
                    <th className="px-5 py-3 text-center">Warehouse</th>
                    <th className="px-5 py-3 text-center">Shop</th>
                    <th className="px-5 py-3 text-center">School</th>
                    <th className="px-5 py-3 text-center bg-rose-50/30">Total Avail</th>
                    <th className="px-5 py-3 text-center">Sold</th>
                    <th className="px-5 py-3 text-center">Returns (C/P)</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-[#081827]">
                  {drilldownBooks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="categories-muted py-12 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                        No books have been registered under this category yet.
                      </td>
                    </tr>
                  ) : (
                    drilldownBooks.map(book => {
                      const m = bookTransactionMetrics.get(book.id) || {
                        warehouseStock: 0,
                        shopStock: 0,
                        schoolStock: 0,
                        totalStock: 0,
                        soldQty: 0,
                        customerReturnQty: 0,
                        publisherReturnQty: 0,
                        valueCost: 0
                      };

                      // Publisher, Class, Category names
                      const pubName = data.publishers.find(p => p.id === book.publisher_id)?.publisher_name || "Unknown";
                      const className = data.classes.find(c => c.id === book.class_id)?.name || "Unknown";
                      const catName = data.categories.find(c => c.id === book.category_id)?.name || "Unknown";

                      // Status
                      let statusBadge = { text: "Available", style: "bg-emerald-50 text-emerald-600 border-emerald-100" };
                      if (m.totalStock === 0) {
                        statusBadge = { text: "Out of Stock", style: "bg-rose-50 text-rose-600 border-rose-100" };
                      } else if (m.totalStock <= book.reorder_level) {
                        statusBadge = { text: "Low Stock", style: "bg-amber-50 text-amber-600 border-amber-100" };
                      }

                      return (
                        <tr key={book.id} className="bg-white transition-colors hover:bg-amber-50/70 dark:bg-[#081827] dark:hover:bg-[#10263c]">
                          <td className="px-5 py-4">
                            <div>
                              <p className="categories-readable text-xs font-extrabold text-slate-950 dark:text-white sm:text-sm">{book.title}</p>
                              <p className="categories-muted mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">Code: {book.book_number} {book.ISBN ? `| ISBN: ${book.ISBN}` : ""}</p>
                            </div>
                          </td>
                          <td className="categories-muted px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">{pubName}</td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="categories-readable font-extrabold text-slate-900 dark:text-white">{className}</p>
                              <p className="categories-muted mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400">{catName}</p>
                            </div>
                          </td>
                          <td className="categories-muted px-5 py-4 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">{m.warehouseStock}</td>
                          <td className="categories-muted px-5 py-4 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">{m.shopStock}</td>
                          <td className="categories-muted px-5 py-4 text-center font-mono font-semibold text-slate-600 dark:text-slate-300">{m.schoolStock}</td>
                          <td className="categories-readable bg-amber-50 px-5 py-4 text-center font-mono font-extrabold text-slate-950 dark:bg-amber-300/10 dark:text-white">{m.totalStock}</td>
                          <td className="px-5 py-4 text-center font-mono font-extrabold text-blue-700 dark:text-blue-300">{m.soldQty}</td>
                          <td className="categories-muted px-5 py-4 text-center font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            <span className="text-emerald-600 font-bold" title="Customer returns">{m.customerReturnQty}</span> / <span className="text-rose-600 font-bold" title="Publisher returns">{m.publisherReturnQty}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold border ${statusBadge.style}`}>
                              {statusBadge.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* CREATE/EDIT DIALOG MODAL */}
      {isFormOpen && (
        <ScreenModalPortal>
          <div className="categories-panel flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-amber-300 bg-white shadow-[0_38px_125px_rgba(15,23,42,0.48)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_38px_125px_rgba(0,0,0,0.68)] animate-scaleIn">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-white/10 dark:bg-[#0d2135]">
              <h2 className="categories-readable font-display text-base font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                {editingCategory ? "Modify Category Details" : "Register New Academic Category"}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-white p-6 text-slate-950 dark:bg-[#081827] dark:text-slate-100">
              <div className="text-xs">
                <label className="categories-readable mb-2 block text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Physics, Urdu, English..."
                  className="categories-control h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-400 dark:hover:border-amber-300/40 dark:focus:border-amber-300"
                />
              </div>

              <div className="text-xs">
                <label className="categories-readable mb-2 block text-xs font-extrabold text-slate-900 dark:text-slate-100">Category Status</label>
                <select
                  value={categoryStatus}
                  onChange={(e) => setCategoryStatus(e.target.value as any)}
                  className="categories-control h-12 w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:hover:border-amber-300/40 dark:focus:border-amber-300"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 text-xs font-bold dark:border-white/10 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-xs font-extrabold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400 bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)] px-6 py-3 text-xs font-extrabold text-slate-950 shadow-[0_12px_28px_rgba(180,123,24,0.22)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-300/40 dark:text-[#081827]"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Category</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </ScreenModalPortal>
      )}

    </div>
  );
}