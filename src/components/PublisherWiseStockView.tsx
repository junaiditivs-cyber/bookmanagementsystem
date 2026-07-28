import React, { useMemo, useState } from "react";
import { DatabaseSchema } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { Download, Printer, Search, Sparkles, Users } from "lucide-react";

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
    <div id="publisher-stock-view" className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100">
      <style>{`
        @media print {
          #publisher-stock-view,
          #publisher-stock-view * {
            color: #000 !important;
          }

          #publisher-stock-view .publisher-stock-panel,
          #publisher-stock-view table,
          #publisher-stock-view thead,
          #publisher-stock-view tbody,
          #publisher-stock-view tr {
            background: #fff !important;
            box-shadow: none !important;
          }

          #publisher-stock-view th,
          #publisher-stock-view td {
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>

      <section className="no-print relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.11),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_34%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 shadow-[0_12px_28px_rgba(180,123,24,0.15)] dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-300">
              <Users className="h-7 w-7" />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200">
                <Sparkles className="h-3.5 w-3.5" />
                Publisher stock catalog
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Publisher-wise Stock Explorer
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Review stock quantities, purchase valuation, retail value, and reorder exposure across publishers.
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-amber-400 bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)] px-4 py-3 text-xs font-extrabold text-slate-950 shadow-[0_14px_32px_rgba(180,123,24,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 dark:border-amber-300/40 dark:text-[#081827]"
            >
              <Download className="h-4 w-4" />
              Export Audit PDF
            </button>
          </div>
        </div>
      </section>

      <div className="no-print rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Publisher Account
            </span>
            <select
              value={selectedPublisher}
              onChange={(event) => setSelectedPublisher(event.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white"
            >
              <option value="">All Publishers</option>
              {activePublishers.map((publisher) => (
                <option key={publisher.id} value={publisher.id}>
                  {publisher.publisher_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Warehouse Location
            </span>
            <select
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 dark:border-white/15 dark:bg-[#10263c] dark:text-white"
            >
              <option value="">All Locations</option>
              {data.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type.toUpperCase()})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Keyword Search
            </span>
            <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 dark:border-white/15 dark:bg-[#10263c]">
              <Search className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
              <input
                type="text"
                placeholder="Search title, code, or ISBN..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full border-0 bg-transparent text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryMetric title="Matched Titles" value={summaryMetrics.booksCount.toLocaleString()} helper="Titles matching filters" />
        <SummaryMetric title="Stock Copies" value={summaryMetrics.totalQty.toLocaleString()} helper="Physical stock units" />
        <SummaryMetric title="Under Threshold" value={summaryMetrics.lowStockCount.toLocaleString()} helper="Reorder alerts" />
        <SummaryMetric title="Cost Value" value={`PKR ${summaryMetrics.totalCostVal.toLocaleString()}`} helper="Purchase valuation" />
        <SummaryMetric title="Retail Value" value={`PKR ${summaryMetrics.totalSaleVal.toLocaleString()}`} helper="Expected revenue" />
      </div>

      <div className="publisher-stock-panel overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#10263c]">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              Detailed Publisher Stock Ledger
            </h2>
            <p className="mt-1 text-[10px] font-semibold text-slate-400">
              Current quantities and valuation for the selected filters.
            </p>
          </div>
          <span className="w-fit rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[10px] font-extrabold text-slate-500 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300">
            Showing {filteredBookStock.length} items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-mono uppercase text-slate-400 dark:border-white/10 dark:bg-[#10263c]">
              <tr>
                <th className="px-5 py-3">Book Code</th>
                <th className="px-5 py-3">Title Description</th>
                <th className="px-5 py-3">Publisher</th>
                <th className="px-5 py-3">Subject / Grade</th>
                <th className="px-5 py-3 text-center">Current Stock</th>
                <th className="px-5 py-3 text-center">Min Reorder</th>
                <th className="px-5 py-3 text-right">Cost Value</th>
                <th className="px-5 py-3 text-right">Potential Revenue</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filteredBookStock.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-xs font-bold text-slate-400">
                    No books match the selected publisher and search filters.
                  </td>
                </tr>
              ) : (
                filteredBookStock.map((item) => (
                  <tr key={item.book.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-4 font-mono text-[10px] font-extrabold text-slate-400">
                      {item.book.book_number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-extrabold text-slate-800 dark:text-slate-100">{item.book.title}</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                        {item.book.ISBN ? `ISBN: ${item.book.ISBN}` : "No ISBN"}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-300">{item.publisherName}</td>
                    <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-300">
                      {item.className} - {item.subjectName}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-extrabold ${
                          item.needsReorder
                            ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                        }`}
                      >
                        {item.qty} units
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-mono font-bold text-slate-400">
                      {item.book.reorder_level} units
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-800 dark:text-slate-100">
                      PKR {item.valueCost.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-slate-500 dark:text-slate-300">
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

function SummaryMetric({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 truncate font-mono text-lg font-extrabold text-slate-900 dark:text-white" title={value}>
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}