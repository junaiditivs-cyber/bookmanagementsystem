import React, { useState, useMemo } from "react";
import { DatabaseSchema } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import {
  AlertTriangle,
  BarChart4,
  BookOpen,
  Bookmark,
  Download,
  Package,
  Printer,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface SubjectWiseStockViewProps {
  data: DatabaseSchema;
}

export default function SubjectWiseStockView({ data }: SubjectWiseStockViewProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Get active subjects
  const activeSubjects = useMemo(() => {
    return data.subjects.filter(s => s.status === "active");
  }, [data.subjects]);

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
        subjectId: book.subject_id,
        className: classEntity?.name || "Unknown Class",
        classId: book.class_id,
        publisherName: publisher?.publisher_name || "Unknown Publisher",
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
      if (selectedSubject && item.subjectId !== selectedSubject) return false;
      if (selectedClass && item.classId !== selectedClass) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.book.title.toLowerCase().includes(query);
        const matchesCode = item.book.book_number.toLowerCase().includes(query);
        const matchesIsbn = (item.book.ISBN || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesCode && !matchesIsbn) return false;
      }
      return true;
    });
  }, [bookStockDetails, selectedSubject, selectedClass, searchQuery]);

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
    const subjectName = selectedSubject ? (data.subjects.find(s => s.id === selectedSubject)?.name || "") : "All Subjects";
    const locName = selectedLocation ? (data.locations.find(l => l.id === selectedLocation)?.name || "") : "All Locations";
    const title = `Subject-wise Stock Audit Report - ${subjectName}`;
    const subtitle = `Filter Constraints: Warehouse: ${locName} | Class: ${selectedClass ? (data.classes.find(c => c.id === selectedClass)?.name || "") : "All"}`;

    const cols = [
      { header: "Code", dataKey: "code" },
      { header: "Book Title", dataKey: "title" },
      { header: "Class", dataKey: "class" },
      { header: "Subject", dataKey: "subject" },
      { header: "Stock Qty", dataKey: "qty" },
      { header: "Reorder", dataKey: "reorder" },
      { header: "Unit Cost", dataKey: "unit_cost" },
      { header: "Total Value", dataKey: "total_val" }
    ];

    const rows = filteredBookStock.map(item => ({
      code: item.book.book_number,
      title: item.book.title,
      class: item.className,
      subject: item.subjectName,
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
      fileName: `SubjectWiseStock_${subjectName.replace(/\s+/g, "_")}.pdf`
    });
  };

  return (
    <div
      id="subject-stock-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{`
        @media print {
          #subject-stock-view,
          #subject-stock-view * {
            color: #000 !important;
          }

          #subject-stock-view .subject-stock-panel,
          #subject-stock-view table,
          #subject-stock-view thead,
          #subject-stock-view tbody,
          #subject-stock-view tr {
            background: #fff !important;
            box-shadow: none !important;
          }

          #subject-stock-view th,
          #subject-stock-view td {
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      {/* PAGE HEADER */}
      <section className="no-print relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-amber-300/15 blur-3xl dark:bg-amber-300/10" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/10" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 shadow-[0_12px_28px_rgba(180,123,24,0.15)] dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-300">
              <Bookmark className="h-7 w-7" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200">
                Curriculum reporting
              </span>
              <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Subject-wise Stock Explorer
              </h1>
              <p className="mt-2 max-w-3xl text-xs font-semibold leading-6 text-slate-600 dark:text-slate-300 sm:text-sm">
                Analyze titles, available copies, stock value, classes, and reorder exposure across academic subjects.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-xs font-extrabold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-100 dark:hover:border-amber-300/30 dark:hover:bg-amber-300/10 dark:hover:text-amber-200"
            >
              <Printer className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              Print Ledger
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-400 bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)] px-5 py-3 text-xs font-extrabold text-slate-950 shadow-[0_12px_28px_rgba(180,123,24,0.22)] transition hover:-translate-y-0.5 hover:brightness-105 dark:border-amber-300/40 dark:text-[#081827]"
            >
              <Download className="h-4 w-4" />
              Export Audit PDF
            </button>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="subject-stock-panel no-print rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            <Search className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-950 dark:text-white">
              Filter Stock Records
            </h2>
            <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Narrow the report by subject, class, warehouse, or keyword.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block font-extrabold text-slate-700 dark:text-slate-200">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 font-bold text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:focus:border-amber-300/40 dark:focus:ring-amber-300/10"
            >
              <option value="">All Subjects</option>
              {activeSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-extrabold text-slate-700 dark:text-slate-200">
              Grade / Class
            </label>
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 font-bold text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:focus:border-amber-300/40 dark:focus:ring-amber-300/10"
            >
              <option value="">All Classes</option>
              {data.classes.map((classEntity) => (
                <option key={classEntity.id} value={classEntity.id}>
                  {classEntity.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-extrabold text-slate-700 dark:text-slate-200">
              Warehouse Location
            </label>
            <select
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 font-bold text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:focus:border-amber-300/40 dark:focus:ring-amber-300/10"
            >
              <option value="">All Warehouses</option>
              {data.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-extrabold text-slate-700 dark:text-slate-200">
              Search Books
            </label>
            <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3.5 shadow-sm transition focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100 dark:border-white/15 dark:bg-[#10263c] dark:focus-within:border-amber-300/40 dark:focus-within:ring-amber-300/10">
              <Search className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <input
                type="text"
                placeholder="Title, code, or ISBN..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-xs font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="subject-stock-panel rounded-[1.6rem] border border-slate-300 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.10)] dark:border-amber-300/20 dark:bg-[#081827]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Matched Titles</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-slate-950 dark:text-white">{summaryMetrics.booksCount}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Titles matching filters</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="subject-stock-panel rounded-[1.6rem] border border-slate-300 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.10)] dark:border-amber-300/20 dark:bg-[#081827]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Stock Copies</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{summaryMetrics.totalQty.toLocaleString()}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Physical stock units</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="subject-stock-panel rounded-[1.6rem] border border-slate-300 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.10)] dark:border-amber-300/20 dark:bg-[#081827]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Under Threshold</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-rose-700 dark:text-rose-300">{summaryMetrics.lowStockCount}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Reorder alerts</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="subject-stock-panel rounded-[1.6rem] border border-slate-300 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.10)] dark:border-amber-300/20 dark:bg-[#081827]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Asset Cost</p>
              <p className="mt-2 truncate font-display text-lg font-extrabold text-slate-950 dark:text-white">PKR {summaryMetrics.totalCostVal.toLocaleString()}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Purchase valuation</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
              <BarChart4 className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="subject-stock-panel rounded-[1.6rem] border border-slate-300 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.10)] dark:border-amber-300/20 dark:bg-[#081827] sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Retail Value</p>
              <p className="mt-2 truncate font-display text-lg font-extrabold text-slate-950 dark:text-white">PKR {summaryMetrics.totalSaleVal.toLocaleString()}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">Revenue potential</p>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      {/* STOCK TABLE */}
      <section className="subject-stock-panel overflow-hidden rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827]">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-[#10263c] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            <h2 className="font-display text-sm font-extrabold text-slate-950 dark:text-white">
              Subject-wise Inventory Ledger
            </h2>
          </div>

          <span className="inline-flex self-start rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-[10px] font-bold text-slate-600 dark:border-white/15 dark:bg-[#081827] dark:text-slate-300 sm:self-auto">
            Total records: {filteredBookStock.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="border-b border-slate-200 bg-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-700 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300">
              <tr>
                <th className="px-5 py-3">Book Code</th>
                <th className="px-5 py-3">Title Description</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3 text-center">Current Stock</th>
                <th className="px-5 py-3 text-center">Min Reorder</th>
                <th className="px-5 py-3 text-right">Cost Value</th>
                <th className="px-5 py-3 text-right">Potential Revenue</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white dark:divide-white/10 dark:bg-[#081827]">
              {filteredBookStock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    No books match the selected subject, class, warehouse, and search filters.
                  </td>
                </tr>
              ) : (
                filteredBookStock.map((item) => (
                  <tr
                    key={item.book.id}
                    className="bg-white transition-colors hover:bg-amber-50/70 dark:bg-[#081827] dark:hover:bg-[#10263c]"
                  >
                    <td className="px-5 py-4 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      {item.book.book_number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-slate-950 dark:text-white">
                        {item.book.title}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {item.publisherName}
                        {item.book.ISBN ? ` | ISBN: ${item.book.ISBN}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600 dark:text-slate-300">
                      {item.subjectName}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {item.className}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-xl border px-2.5 py-1 text-[10px] font-extrabold ${
                          item.needsReorder
                            ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                        }`}
                      >
                        {item.qty} units
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                      {item.book.reorder_level} units
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-950 dark:text-white">
                      PKR {item.valueCost.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">
                      PKR {item.valueSale.toLocaleString()}
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