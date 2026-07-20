import React, { useState, useMemo } from "react";
import { DatabaseSchema, Subject, Book } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { 
  Bookmark, Plus, Search, Edit2, ShieldAlert, X, RefreshCw, BookOpen, Package, 
  ArrowLeft, Download, Printer, CheckCircle, AlertTriangle, PlayCircle, Eye, Trash2
} from "lucide-react";
import { apiFetch } from "../api/http";

interface SubjectsViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

export default function SubjectsView({ data, onRefresh, onShowNotification }: SubjectsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectStatus, setSubjectStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  // Drilldown states
  const [drilldownSubject, setDrilldownSubject] = useState<Subject | null>(null);

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

  // --- STATS PER SUBJECT ---
  const subjectStats = useMemo(() => {
    const stats = new Map<string, {
      booksCount: number;
      totalStock: number;
      soldQty: number;
      customerReturnQty: number;
      publisherReturnQty: number;
      totalValueCost: number;
    }>();

    data.subjects.forEach(s => {
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

      const sStat = stats.get(b.subject_id);
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
  }, [data.subjects, data.books, bookTransactionMetrics]);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setSubjectName("");
    setSubjectStatus("active");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setSubjectStatus(subject.status);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      onShowNotification("Subject Name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      const url = editingSubject ? `/api/subjects/${editingSubject.id}` : `/api/subjects`;
      const method = editingSubject ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectName, status: subjectStatus })
      });

      if (!res.ok) throw new Error("Failed to save subject record.");

      onShowNotification(
        editingSubject ? "Subject updated successfully!" : "New subject registered successfully!", 
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

  const toggleDeactivate = async (subject: Subject) => {
    const newStatus = subject.status === "active" ? "inactive" : "active";
    try {
      const res = await apiFetch(`/api/subjects/${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subject.name, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to change subject status.");
      onShowNotification(`Subject successfully ${newStatus === "active" ? "activated" : "deactivated"}.`, "success");
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    }
  };

  const handleDeleteSubject = async (subId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this subject? This action cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/subjects/${subId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete subject.");
      }
      onShowNotification("Subject deleted successfully!", "success");
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    }
  };

  // PDF Export of Subject Overview
  const handleExportPDFAll = () => {
    const title = "Subjects Curriculum Audit & Valuation Ledger";
    const subtitle = `Generated Date: ${new Date().toLocaleDateString()}`;

    const cols = [
      { header: "Subject Name", dataKey: "name" },
      { header: "Status", dataKey: "status" },
      { header: "Books Count", dataKey: "booksCount" },
      { header: "Stock Copies", dataKey: "stock" },
      { header: "Sold Qty", dataKey: "sold" },
      { header: "Customer Returns", dataKey: "cust_ret" },
      { header: "Publisher Returns", dataKey: "pub_ret" },
      { header: "Cost Valuation", dataKey: "value" }
    ];

    const rows = filteredSubjects.map(s => {
      const stats = subjectStats.get(s.id) || { booksCount: 0, totalStock: 0, soldQty: 0, customerReturnQty: 0, publisherReturnQty: 0, totalValueCost: 0 };
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
        { label: "Total Subjects", value: filteredSubjects.length },
        { label: "Active Subjects", value: filteredSubjects.filter(s => s.status === "active").length }
      ],
      fileName: "Subjects_Directory_Report.pdf"
    });
  };

  const filteredSubjects = data.subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Drilldown calculations
  const drilldownBooks = useMemo(() => {
    if (!drilldownSubject) return [];
    return data.books.filter(b => b.subject_id === drilldownSubject.id);
  }, [drilldownSubject, data.books]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. MASTER VIEW */}
      {!drilldownSubject ? (
        <>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-rose-500" />
                <span>Curriculum Subjects Directory</span>
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                Configure school curriculum subjects to segment books, check active stock, and print curriculum ledgers.
              </p>
            </div>

            <div className="flex gap-2 self-start sm:self-auto">
              <button
                onClick={handleExportPDFAll}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export Catalog PDF</span>
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 btn-premium-pink text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Add New Subject</span>
              </button>
            </div>
          </div>

          {/* FILTER & SEARCH */}
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects by name (e.g. Physics, Urdu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 text-slate-800 focus:ring-0 focus:outline-none w-full font-semibold placeholder-slate-400"
            />
          </div>

          {/* SUBJECTS LIST TABLE */}
          <div className="glass-panel rounded-2xl border border-white/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Subject ID</th>
                    <th className="px-5 py-3">Subject Name</th>
                    <th className="px-5 py-3 text-center">Books Count</th>
                    <th className="px-5 py-3 text-center">In Stock</th>
                    <th className="px-5 py-3 text-center">Sold Qty</th>
                    <th className="px-5 py-3 text-right">Value (Cost)</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-mono font-medium">
                        No subjects registered yet. Click "Add New Subject" to organize syllabus records.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map(subject => {
                      const stats = subjectStats.get(subject.id) || {
                        booksCount: 0,
                        totalStock: 0,
                        soldQty: 0,
                        customerReturnQty: 0,
                        publisherReturnQty: 0,
                        totalValueCost: 0
                      };
                      return (
                        <tr key={subject.id} className="hover:bg-white/40 transition-colors">
                          <td className="px-5 py-4 font-mono text-[10px] text-slate-400 font-bold">{subject.id}</td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">{subject.name}</span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600">
                              {stats.booksCount} books
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {stats.totalStock.toLocaleString()} units
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center text-slate-500 font-semibold font-mono">
                            {stats.soldQty.toLocaleString()} units
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-800">
                            PKR {stats.totalValueCost.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-bold border ${
                              subject.status === "active" 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                              {subject.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-1.5">
                            <button
                              onClick={() => setDrilldownSubject(subject)}
                              className="px-2 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-100 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="View Subject Stock"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Stock</span>
                            </button>
                            <button 
                              onClick={() => handleOpenEdit(subject)} 
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg inline-flex transition-colors cursor-pointer border border-transparent"
                              title="Edit Subject"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {stats.booksCount === 0 ? (
                              <button 
                                onClick={() => handleDeleteSubject(subject.id)} 
                                className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg inline-flex transition-colors cursor-pointer border border-transparent"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => toggleDeactivate(subject)} 
                                className={`p-1.5 rounded-lg inline-flex transition-colors cursor-pointer border border-transparent ${
                                  subject.status === "active"
                                    ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50/50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50"
                                }`}
                                title={subject.status === "active" ? "Deactivate Subject" : "Activate Subject"}
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
        
        /* 2. SUBJECT DRILLDOWN VIEW */
        <div className="space-y-6 animate-fadeIn">
          
          {/* HEADER BACK BUTTON */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrilldownSubject(null)}
                className="p-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-rose-500" />
                  <span>Subject Inventory: {drilldownSubject.name}</span>
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
                  Detailed ledger breakdown of syllabus books, individual location balances, and total sales pipeline.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const title = `Subject Inventory Detail Ledger - ${drilldownSubject.name}`;
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
                  subtitle: `Subject: ${drilldownSubject.name} Ledger Details`,
                  columns: cols,
                  rows,
                  summaryData: [
                    { label: "Book Titles Count", value: drilldownBooks.length },
                    { label: "Aggregate Copies", value: drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.totalStock || 0), 0) }
                  ],
                  fileName: `Subject_${drilldownSubject.name.replace(/\s+/g, "_")}_Details.pdf`
                });
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Details PDF</span>
            </button>
          </div>

          {/* SUMMARY CARDS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Registered Titles</p>
              <p className="text-xl font-display font-bold text-slate-800 mt-1">{drilldownBooks.length}</p>
              <div className="text-[9px] text-slate-400 mt-1 font-medium">Under subject {drilldownSubject.name}</div>
            </div>
            <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Current Stock Available</p>
              <p className="text-xl font-display font-bold text-rose-600 mt-1">
                {drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.totalStock || 0), 0).toLocaleString()}
              </p>
              <div className="text-[9px] text-slate-400 mt-1 font-medium">Combined locations inventory</div>
            </div>
            <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Accumulated Sales</p>
              <p className="text-xl font-display font-bold text-indigo-600 mt-1 font-mono">
                {drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.soldQty || 0), 0).toLocaleString()}
              </p>
              <div className="text-[9px] text-slate-400 mt-1 font-medium">Total sold copies</div>
            </div>
            <div className="glass-card border border-slate-200/50 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Asset Valuation</p>
              <p className="text-sm font-bold text-slate-800 mt-2 truncate">
                PKR {drilldownBooks.reduce((sum, b) => sum + (bookTransactionMetrics.get(b.id)?.valueCost || 0), 0).toLocaleString()}
              </p>
              <div className="text-[9px] text-slate-400 mt-1 font-medium">Purchase cost cumulative</div>
            </div>
          </div>

          {/* DRILLDOWN DETAIL TABLE */}
          <div className="glass-panel rounded-2xl border border-white/60 overflow-hidden shadow-sm">
            <div className="bg-white/80 px-5 py-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="font-display font-extrabold text-slate-800 flex items-center gap-1.5">
                <span>Books Under {drilldownSubject.name}</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg font-bold">Records: {drilldownBooks.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
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
                <tbody className="divide-y divide-slate-100">
                  {drilldownBooks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400 font-mono font-medium">
                        No books have been registered under this subject yet.
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
                        <tr key={book.id} className="hover:bg-white/40 transition-colors">
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-bold text-slate-800 text-xs sm:text-sm">{book.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Code: {book.book_number} {book.ISBN ? `| ISBN: ${book.ISBN}` : ""}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-semibold">{pubName}</td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-bold text-slate-700">{className}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{catName}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center font-mono font-medium text-slate-500">{m.warehouseStock}</td>
                          <td className="px-5 py-4 text-center font-mono font-medium text-slate-500">{m.shopStock}</td>
                          <td className="px-5 py-4 text-center font-mono font-medium text-slate-500">{m.schoolStock}</td>
                          <td className="px-5 py-4 text-center font-mono font-extrabold text-slate-900 bg-rose-50/20">{m.totalStock}</td>
                          <td className="px-5 py-4 text-center font-mono font-medium text-indigo-600">{m.soldQty}</td>
                          <td className="px-5 py-4 text-center text-[10px] font-mono text-slate-500">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-display font-extrabold text-slate-900">
                {editingSubject ? "Modify Subject Details" : "Register New Academic Subject"}
              </h2>
              <button 
                onClick={() => setIsFormOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="text-xs">
                <label className="block font-bold text-slate-500 mb-1.5">
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="e.g. Physics, Urdu, English..."
                  className="w-full glass-input rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:outline-none font-bold"
                />
              </div>

              <div className="text-xs">
                <label className="block font-bold text-slate-500 mb-1.5">Subject Status</label>
                <select
                  value={subjectStatus}
                  onChange={(e) => setSubjectStatus(e.target.value as any)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 btn-premium-pink text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Subject</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}