import React, { useState, useEffect } from "react";
import { 
  ArrowLeftRight, Calendar, Building2, BookOpen, Calculator, Info, AlertTriangle, ArrowRightCircle
} from "lucide-react";
import { DatabaseSchema, StockTransfer } from "../types";
import { apiFetch } from "../api/http";

interface TransfersViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

export default function TransfersView({ data, onRefresh, onShowNotification }: TransfersViewProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fromLocId, setFromLocId] = useState("");
  const [toLocId, setToLocId] = useState("");
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Get available stock at source location
  const getAvailableStock = () => {
    if (!bookId || !fromLocId) return 0;
    const balance = data.stock_balances.find(b => b.book_id === bookId && b.location_id === fromLocId);
    return balance ? balance.quantity : 0;
  };

  const availableStock = getAvailableStock();

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocId || !toLocId || !bookId || !quantity) {
      onShowNotification("Please fill in all required fields.", "error");
      return;
    }
    if (fromLocId === toLocId) {
      onShowNotification("Source and Destination locations cannot be the same.", "error");
      return;
    }
    if (Number(quantity) > availableStock) {
      onShowNotification(`Insufficient stock at source! Only has ${availableStock} units.`, "error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          from_location_id: fromLocId,
          to_location_id: toLocId,
          book_id: bookId,
          quantity: Number(quantity),
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit stock transfer.");
      }

      onShowNotification("Stock transferred successfully!", "success");
      setQuantity("");
      setNotes("");
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const activeBooks = data.books.filter(b => b.status === "active");
  const activeLocations = data.locations.filter(l => l.status === "active");

  return (
    <div id="transfers-view" className="space-y-6 pb-12 animate-fadeIn">
      {/* PAGE HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.11),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_34%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 shadow-[0_12px_28px_rgba(180,123,24,0.15)] dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-300">
              <ArrowLeftRight className="h-7 w-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200">
                <Building2 className="h-3.5 w-3.5" />
                Inventory transfer
              </div>

              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Stock Transfers
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Move books between locations while keeping source and destination stock ledgers synchronized.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Active Locations</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{activeLocations.length.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Available transfer points</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Active Books</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{activeBooks.length.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Titles available to transfer</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Source Stock</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{availableStock.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Units for current selection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* TRANSFER FORM */}
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#10263c]">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-[#10263c] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
                Transfer Details
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Select the source, destination, book, and quantity to post the movement.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Required fields marked *
            </span>
          </div>

          <form onSubmit={handleTransfer} className="space-y-6 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  Transfer Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                />
              </div>

              <div className="hidden md:block" aria-hidden="true" />

              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  From Location *
                </label>
                <select
                  required
                  value={fromLocId}
                  onChange={(e) => setFromLocId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                >
                  <option value="">Select source location</option>
                  {activeLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  To Location *
                </label>
                <select
                  required
                  value={toLocId}
                  onChange={(e) => setToLocId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                >
                  <option value="">Select destination location</option>
                  {activeLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  Book to Transfer *
                </label>
                <select
                  required
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                >
                  <option value="">Choose an active book</option>
                  {activeBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.book_number})</option>
                  ))}
                </select>
              </div>

              {bookId && fromLocId && (
                <div className="md:col-span-2">
                  <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-300/15 dark:bg-blue-300/[0.06] sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">
                        Available at Source
                      </p>
                      <p className="mt-1 font-display text-lg font-extrabold text-slate-900 dark:text-white">
                        {availableStock.toLocaleString()} units
                      </p>
                    </div>

                    {quantity && Number(quantity) > availableStock ? (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-extrabold text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
                        <AlertTriangle className="h-4 w-4" />
                        Insufficient stock at source
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Stock available
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <Calculator className="h-4 w-4 text-amber-500" />
                  Transfer Quantity *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Transfer Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Driver, vehicle, dispatch challan, or other transfer notes..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10px] font-medium leading-5 text-slate-500 dark:text-slate-400">
                Posting will reduce source stock and increase destination stock in the same transfer record.
              </p>

              <button
                type="submit"
                disabled={loading || !fromLocId || !toLocId || !bookId || !quantity || Number(quantity) > availableStock}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-[0_12px_30px_rgba(245,158,11,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(245,158,11,0.34)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/25 border-t-slate-950" />
                ) : (
                  <ArrowRightCircle className="h-4 w-4" />
                )}
                Initiate Transfer
              </button>
            </div>
          </form>
        </section>

        {/* INFORMATION PANEL */}
        <aside className="space-y-5">
          <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#10263c]">
            <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-[#10263c]">
              <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-slate-900 dark:text-white">
                <Info className="h-4 w-4 text-amber-500" />
                How Transfer Posting Works
              </h2>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-extrabold text-blue-700 dark:bg-blue-300/10 dark:text-blue-200">
                  1
                </span>
                <div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Transfer Out
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500 dark:text-slate-400">
                    The selected quantity is deducted from the source location.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-50 text-xs font-extrabold text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
                  2
                </span>
                <div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Transfer In
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500 dark:text-slate-400">
                    The same quantity is added to the destination location.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xs font-extrabold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                  3
                </span>
                <div>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white">
                    Ledger History
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500 dark:text-slate-400">
                    Both movements are recorded automatically for audit tracking.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-[0_18px_50px_rgba(245,158,11,0.12)] dark:border-amber-300/20 dark:from-amber-300/10 dark:to-orange-300/[0.04]">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-amber-950 dark:text-amber-100">
                  Transfer Safety
                </p>
                <p className="mt-1 text-[11px] font-medium leading-5 text-amber-800/80 dark:text-amber-100/70">
                  Source and destination cannot be the same, and the requested quantity cannot exceed available source stock.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}