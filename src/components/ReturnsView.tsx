import React, { useState, useEffect } from "react";
import { 
  RotateCcw, Calendar, Building2, User, BookOpen, Calculator, AlertTriangle, ArrowLeftRight, Users
} from "lucide-react";
import { DatabaseSchema, CustomerReturn, PublisherReturn } from "../types";
import { apiFetch } from "../api/http";

interface ReturnsViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
  preSelectedBookId?: string;
  onClearPreSelectedBookId?: () => void;
}

export default function ReturnsView({
  data,
  onRefresh,
  onShowNotification,
  preSelectedBookId,
  onClearPreSelectedBookId
}: ReturnsViewProps) {
  const [activeTab, setActiveTab] = useState<"customer" | "publisher">("customer");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [bookId, setBookId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Customer Return specific
  const [originalSale, setOriginalSale] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Publisher Return specific
  const [publisherId, setPublisherId] = useState("");

  useEffect(() => {
    if (preSelectedBookId) {
      setBookId(preSelectedBookId);
    }
  }, [preSelectedBookId]);

  // Set default publisher if book is selected in publisher tab
  const selectedBook = data.books.find(b => b.id === bookId);
  useEffect(() => {
    if (selectedBook && activeTab === "publisher") {
      setPublisherId(selectedBook.publisher_id);
    }
  }, [bookId, selectedBook, activeTab]);

  // Get current stock lookup
  const getAvailableStock = () => {
    if (!bookId || !locationId) return 0;
    const balance = data.stock_balances.find(b => b.book_id === bookId && b.location_id === locationId);
    return balance ? balance.quantity : 0;
  };

  const availableStock = getAvailableStock();

  const handleCustomerReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId || !locationId || !quantity || !reason) {
      onShowNotification("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/customer-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          original_sale_number: originalSale,
          customer_name: customerName,
          book_id: bookId,
          location_id: locationId,
          quantity: Number(quantity),
          reason,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log customer return.");
      }

      onShowNotification("Customer return registered successfully!", "success");
      setQuantity("");
      setReason("");
      setNotes("");
      setOriginalSale("");
      setCustomerName("");
      if (onClearPreSelectedBookId) onClearPreSelectedBookId();
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublisherReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherId || !bookId || !locationId || !quantity || !reason) {
      onShowNotification("Please fill in all required fields.", "error");
      return;
    }
    if (Number(quantity) > availableStock) {
      onShowNotification(`Cannot return! Selected location only has ${availableStock} units of this book.`, "error");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/publisher-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          publisher_id: publisherId,
          book_id: bookId,
          location_id: locationId,
          quantity: Number(quantity),
          reason,
          notes
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log return to publisher.");
      }

      onShowNotification("Publisher return registered successfully!", "success");
      setQuantity("");
      setReason("");
      setNotes("");
      if (onClearPreSelectedBookId) onClearPreSelectedBookId();
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
    <div id="returns-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-500" />
            <span>Returns Ledger Handling</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Log book returns from school clients/retail outlets, or pack defective/consignment books back to publishers.
          </p>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start">
          <button
            onClick={() => { setActiveTab("customer"); setQuantity(""); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "customer" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Customer Return
          </button>
          <button
            onClick={() => { setActiveTab("publisher"); setQuantity(""); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "publisher" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Return to Publisher
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CUSTOMER RETURN FORM */}
        {activeTab === "customer" ? (
          <div className="lg:col-span-2 glass-panel border border-white/60 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Log Book Return from Customer</span>
            </h2>

            <form onSubmit={handleCustomerReturn} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Return Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Original Invoice Reference # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SL-1001"
                    value={originalSale}
                    onChange={(e) => setOriginalSale(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Customer / School Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Noor School"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Returned Book *</label>
                  <select
                    required
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Book --</option>
                    {activeBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.title} ({b.book_number})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Receiving Warehouse Location *</label>
                  <select
                    required
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Storage Location --</option>
                    {activeLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Returned Copy Qty *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 5"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Reason for Return *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Damaged covers, extra curriculum copies, over-ordered"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional receiving clerk specifications..."
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  <span>Log Customer Return</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* RETURN TO PUBLISHER FORM */
          <div className="lg:col-span-2 glass-panel border border-white/60 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-rose-500" />
              <span>Return Books to Publisher</span>
            </h2>

            <form onSubmit={handlePublisherReturn} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Return Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Target Publisher *</label>
                  <select
                    required
                    value={publisherId}
                    onChange={(e) => setPublisherId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Choose Publisher --</option>
                    {data.publishers.map(p => (
                      <option key={p.id} value={p.id}>{p.publisher_name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Book to Return *</label>
                  <select
                    required
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Book --</option>
                    {activeBooks
                      .filter(b => !publisherId || b.publisher_id === publisherId)
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.title} ({b.book_number})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Source Location *</label>
                  <select
                    required
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Source Location --</option>
                    {activeLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Quantity to Return *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                {bookId && locationId && (
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Available Stock before Return</span>
                      <p className="text-slate-800 font-mono font-bold mt-1 text-xs">
                        {availableStock} Units Available
                      </p>
                    </div>
                    {quantity && Number(quantity) > availableStock && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Insufficient stock
                      </div>
                    )}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Reason for Return *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Defective binding, misprints, expired consignment"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Shipment details, return authorization slip numbers..."
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !quantity || Number(quantity) > availableStock}
                  className="px-5 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                  <span>Ship Return to Publisher</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* INSTRUCTIONS GUIDE */}
        <div className="space-y-6">
          <div className="glass-panel border border-white/60 rounded-2xl p-5 text-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2.5">
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>Workflow Verification</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
              {activeTab === "customer" ? (
                "When a school or individual customer returns book stock, those units are re-added directly to your live warehouse balances. An audit trail registers under customer returns logs."
              ) : (
                "Returns to publisher are heavily guarded. The system will NOT permit packaging returns that exceed actual book levels physically present at that specific storage node."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}