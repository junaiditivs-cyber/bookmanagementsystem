import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, Calendar, Building2, BookOpen, Calculator, Info, AlertTriangle, AlertCircle
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { apiFetch } from "../api/http";

interface DamageLossViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

export default function DamageLossView({ data, onRefresh, onShowNotification }: DamageLossViewProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [bookId, setBookId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState<"Damage" | "Loss" | "Free Sample" | "Other">("Damage");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Set default location on load
  useEffect(() => {
    if (data.locations.length > 0 && !locationId) {
      setLocationId(data.locations[0].id);
    }
  }, [data.locations]);

  // Get available stock
  const getAvailableStock = () => {
    if (!bookId || !locationId) return 0;
    const balance = data.stock_balances.find(b => b.book_id === bookId && b.location_id === locationId);
    return balance ? balance.quantity : 0;
  };

  const availableStock = getAvailableStock();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !locationId || !quantity || !reason) {
      onShowNotification("Please fill in all required fields.", "error");
      return;
    }
    if (Number(quantity) > availableStock) {
      onShowNotification(`Cannot deduct! Only ${availableStock} units exist at this location.`, "error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/damage-loss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          book_id: bookId,
          location_id: locationId,
          quantity: Number(quantity),
          reason,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log damage/loss.");
      }

      onShowNotification("Deduction recorded successfully!", "success");
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
    <div id="damage-loss-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      
      {/* HEADER */}
      <div className="border-b border-slate-200/60 pb-5">
        <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <span>Damage, Loss & Free Samples</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
          Deduct damaged or lost copies, or log free syllabus sample copies distributed to teachers and partner schools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM PANEL */}
        <div className="lg:col-span-2 glass-panel border border-white/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deduction Date</span>
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
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deduct From Location *</span>
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>-- Choose Location --</option>
                  {activeLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Select Book *</span>
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

              {bookId && locationId && (
                <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Available Stock before Deduction</span>
                    <p className="text-slate-800 font-mono font-bold mt-1 text-xs">
                      {availableStock} Units Available
                    </p>
                  </div>
                  {quantity && Number(quantity) > availableStock && (
                    <div className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Quantity exceeds storage stock
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  <span>Quantity to Deduct *</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="e.g. 2"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Reason Category *</label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="Damage">Damage (Unusable pages, defective prints)</option>
                  <option value="Loss">Loss (Theft, missing during transit)</option>
                  <option value="Free Sample">Free Sample (Marketing, teacher review copies)</option>
                  <option value="Other">Other / Adjustments</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Detailed Explanation / Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify which school received teacher copies, or specify transit parcel theft reports..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none resize-none"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading || !bookId || !quantity || Number(quantity) > availableStock}
                className="px-5 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                <span>Record Deduction</span>
              </button>
            </div>
          </form>
        </div>

        {/* INFO GUIDES */}
        <div className="space-y-6">
          <div className="glass-panel border border-white/60 rounded-2xl p-5 text-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2.5">
              <Info className="w-4 h-4 text-rose-500" />
              <span>Deductions Audit</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
              Every damage, loss, or sample distribution is audited. Posting registers:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-500 mt-2 space-y-1.5 pl-1 font-medium">
              <li>An irreversible entry inside the <b className="text-slate-700">Damage / Loss Register</b>.</li>
              <li>A corresponding negative entry in <b className="text-slate-700">Stock History</b> with appropriate tags.</li>
              <li>Calculates live shrinkages and stock value loss percentages automatically.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}