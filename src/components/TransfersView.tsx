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
    <div id="transfers-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      
      {/* HEADER */}
      <div className="border-b border-slate-200/60 pb-5">
        <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-rose-500" />
          <span>Stock Transfers Logistics</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
          Move physical book stock from central warehouses to retail shelves or specific schools with dual-ledger verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM PANEL */}
        <div className="lg:col-span-2 glass-panel border border-white/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Transfer Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                />
              </div>

              <div>
                {/* placeholder to preserve grid alignment */}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>From Location (Source) *</span>
                </label>
                <select
                  required
                  value={fromLocId}
                  onChange={(e) => setFromLocId(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Source Store --</option>
                  {activeLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>To Location (Destination) *</span>
                </label>
                <select
                  required
                  value={toLocId}
                  onChange={(e) => setToLocId(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Target Store --</option>
                  {activeLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Select Book to Transfer *</span>
                </label>
                <select
                  required
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choose Book --</option>
                  {activeBooks.map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.book_number})</option>
                  ))}
                </select>
              </div>

              {bookId && fromLocId && (
                <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Available Stock at Source:</span>
                    <p className="text-slate-800 font-mono font-bold mt-1 text-xs">
                      {availableStock} Units Available
                    </p>
                  </div>
                  {quantity && Number(quantity) > availableStock && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Insufficient stock at source
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  <span>Transfer Quantity *</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="e.g. 20"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Transfer Challan Notes / Dispatch Memo</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Driver name, vehicle number, dispatch challan numbers..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none resize-none"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading || !fromLocId || !toLocId || !bookId || !quantity || Number(quantity) > availableStock}
                className="px-5 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <ArrowRightCircle className="w-4 h-4 text-white" />
                )}
                <span>Initiate Transfer</span>
              </button>
            </div>
          </form>
        </div>

        {/* INFO PANEL */}
        <div className="space-y-6">
          <div className="glass-panel border border-white/60 rounded-2xl p-5 text-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2.5">
              <Info className="w-4 h-4 text-rose-500" />
              <span>Double-Sided Posting</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
              The system enforces dual-entry ledger safety on transfers. When posted:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-500 mt-2 space-y-1.5 pl-1 font-medium">
              <li>A <b className="text-slate-700">Transfer Out ledger</b> decreases From Location's balance.</li>
              <li>A <b className="text-slate-700">Transfer In ledger</b> increases To Location's balance.</li>
              <li>Both actions receive distinct ledger history logs automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}