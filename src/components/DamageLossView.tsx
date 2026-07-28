import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Info,
  PackageMinus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { apiFetch } from "../api/http";

const DAMAGE_LOSS_VIEW_THEME_GUARD = `
html.dark #damage-loss-view {
  color: #e8eef7 !important;
}
html.dark #damage-loss-view [class*="text-slate-"] {
  color: #d9e4ef !important;
}
html.dark #damage-loss-view [class*="dark:text-white"] {
  color: #ffffff !important;
}
html.dark #damage-loss-view [class*="dark:text-[#f7ddb0]"] {
  color: #f7ddb0 !important;
}
html.dark #damage-loss-view [class*="dark:text-[#081827]"] {
  color: #081827 !important;
}
html.dark #damage-loss-view [class*="dark:text-amber-"] {
  color: #f4d88a !important;
}
html.dark #damage-loss-view [class*="dark:text-blue-"] {
  color: #bfdbfe !important;
}
html.dark #damage-loss-view [class*="dark:text-emerald-"] {
  color: #a7f3d0 !important;
}
html.dark #damage-loss-view [class*="dark:text-rose-"] {
  color: #fecdd3 !important;
}
html.dark #damage-loss-view [class*="dark:bg-white/"] ,
html.dark #damage-loss-view [class*="dark:bg-white["] ,
html.dark #damage-loss-view [class*="bg-white/"] {
  background-color: #10263c !important;
}
html.dark #damage-loss-view [class*="bg-slate-50"] {
  background-color: #10263c !important;
}
html.dark #damage-loss-view [class*="dark:bg-[#081827]"] {
  background-color: #081827 !important;
}
html.dark #damage-loss-view [class*="dark:bg-[#10263c]"] {
  background-color: #10263c !important;
}
html.dark #damage-loss-view [class*="dark:bg-amber-"] {
  background-color: rgba(245, 208, 121, 0.12) !important;
}
html.dark #damage-loss-view [class*="dark:bg-blue-"] {
  background-color: rgba(59, 130, 246, 0.14) !important;
}
html.dark #damage-loss-view [class*="dark:bg-emerald-"] {
  background-color: rgba(16, 185, 129, 0.14) !important;
}
html.dark #damage-loss-view [class*="dark:bg-rose-"] {
  background-color: rgba(244, 63, 94, 0.14) !important;
}
html.dark #damage-loss-view [class*="border-white/"] {
  border-color: rgba(247, 221, 176, 0.22) !important;
}
html.dark #damage-loss-view input,
html.dark #damage-loss-view select,
html.dark #damage-loss-view textarea {
  background-color: #10263c !important;
  color: #ffffff !important;
  border-color: rgba(247, 221, 176, 0.34) !important;
  caret-color: #f7ddb0 !important;
}
html.dark #damage-loss-view input::placeholder,
html.dark #damage-loss-view textarea::placeholder {
  color: #a9b8c8 !important;
  opacity: 1 !important;
}
html.dark #damage-loss-view select option {
  background-color: #10263c !important;
  color: #ffffff !important;
}
html:not(.dark) #damage-loss-view {
  color: #0f172a !important;
}
html:not(.dark) #damage-loss-view [class*="bg-white/"] {
  background-color: #ffffff !important;
}
html:not(.dark) #damage-loss-view [class*="border-white/"] {
  border-color: #cbd5e1 !important;
}
html:not(.dark) #damage-loss-view input,
html:not(.dark) #damage-loss-view select,
html:not(.dark) #damage-loss-view textarea {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}
html:not(.dark) #damage-loss-view input::placeholder,
html:not(.dark) #damage-loss-view textarea::placeholder {
  color: #64748b !important;
  opacity: 1 !important;
}
`;

interface DamageLossViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

const INPUT_CLASS =
  "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10 dark:[color-scheme:dark]";

const TEXTAREA_CLASS =
  "min-h-[110px] w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10";

const PANEL_CLASS =
  "rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_24px_75px_rgba(0,0,0,0.42)]";

const SUB_PANEL_CLASS =
  "rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#10263c]";

const LABEL_CLASS =
  "mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-slate-100";

export default function DamageLossView({
  data,
  onRefresh,
  onShowNotification,
}: DamageLossViewProps) {
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [bookId, setBookId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState<
    "Damage" | "Loss" | "Free Sample" | "Other"
  >("Damage");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data.locations.length > 0 && !locationId) {
      setLocationId(data.locations[0].id);
    }
  }, [data.locations, locationId]);

  const getAvailableStock = () => {
    if (!bookId || !locationId) return 0;

    const balance = data.stock_balances.find(
      (item) =>
        item.book_id === bookId &&
        item.location_id === locationId,
    );

    return balance ? Number(balance.quantity || 0) : 0;
  };

  const availableStock = getAvailableStock();

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!bookId || !locationId || !quantity || !reason) {
      onShowNotification(
        "Please fill in all required fields.",
        "error",
      );
      return;
    }

    if (Number(quantity) > availableStock) {
      onShowNotification(
        `Cannot deduct! Only ${availableStock} units exist at this location.`,
        "error",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/damage-loss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          book_id: bookId,
          location_id: locationId,
          quantity: Number(quantity),
          reason,
          notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to log damage/loss.",
        );
      }

      onShowNotification(
        "Deduction recorded successfully!",
        "success",
      );
      setQuantity("");
      setNotes("");
      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const activeBooks = data.books.filter(
    (book) => book.status === "active",
  );

  const activeLocations = data.locations.filter(
    (location) => location.status === "active",
  );

  const selectedBook = data.books.find(
    (book) => book.id === bookId,
  );

  const selectedLocation = data.locations.find(
    (location) => location.id === locationId,
  );

  const exceedsStock =
    Boolean(quantity) && Number(quantity) > availableStock;

  return (
    <div
      id="damage-loss-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{DAMAGE_LOSS_VIEW_THEME_GUARD}</style>

      <section
        className="
          relative overflow-hidden rounded-[2rem] border
          border-amber-300 bg-white
          px-6 py-6
          shadow-[0_20px_60px_rgba(15,23,42,0.12)]
          dark:border-amber-300/20
          dark:bg-[#081827]
          dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]
          sm:px-8 sm:py-7
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.11),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_34%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                grid h-14 w-14 shrink-0 place-items-center
                rounded-2xl border border-rose-200
                bg-rose-50 text-rose-700
                shadow-[0_12px_28px_rgba(225,29,72,0.14)]
                dark:border-rose-400/20
                dark:bg-rose-400/10 dark:text-rose-300
              "
            >
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div>
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300 bg-amber-50
                  px-3 py-1 text-[9px] font-black uppercase
                  tracking-[0.22em] text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-200
                "
              >
                <PackageMinus className="h-3.5 w-3.5" />
                Inventory deduction
              </div>

              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Damage, Loss & Free Samples
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Deduct damaged or lost copies, or log free sample
                distributions with a clear audit record.
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex items-center gap-2 self-start
              rounded-2xl border border-emerald-200
              bg-emerald-50 px-4 py-3
              text-xs font-extrabold text-emerald-800
              dark:border-emerald-400/20
              dark:bg-emerald-400/10 dark:text-emerald-200
              lg:self-center
            "
          >
            <ShieldCheck className="h-4 w-4" />
            Audited transaction
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className={`${PANEL_CLASS} p-5 sm:p-7 xl:col-span-2`}>
          <div className="mb-6 border-b border-slate-200 pb-5 dark:border-white/10">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-[#f7ddb0]">
              Record Inventory Deduction
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              All form fields and the main container remain clearly
              visible in both light and dark mode.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>
                  <Calendar className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Deduction Date</span>
                </label>

                <input
                  type="date"
                  required
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <Building2 className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Deduct From Location *</span>
                </label>

                <select
                  required
                  value={locationId}
                  onChange={(event) =>
                    setLocationId(event.target.value)
                  }
                  className={INPUT_CLASS}
                >
                  <option value="" disabled>
                    -- Choose Location --
                  </option>

                  {activeLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>
                  <BookOpen className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Select Book *</span>
                </label>

                <select
                  required
                  value={bookId}
                  onChange={(event) => setBookId(event.target.value)}
                  className={INPUT_CLASS}
                >
                  <option value="">-- Choose Book --</option>

                  {activeBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({book.book_number})
                    </option>
                  ))}
                </select>
              </div>

              {bookId && locationId && (
                <div
                  className={`
                    sm:col-span-2 flex flex-col gap-4 p-4
                    sm:flex-row sm:items-center sm:justify-between
                    ${SUB_PANEL_CLASS}
                  `}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      Available Stock Before Deduction
                    </span>

                    <p className="mt-1 font-mono text-base font-extrabold text-slate-950 dark:text-white">
                      {availableStock} Units Available
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {selectedBook?.title || "Selected book"} at{" "}
                      {selectedLocation?.name || "selected location"}
                    </p>
                  </div>

                  {exceedsStock ? (
                    <div
                      className="
                        inline-flex items-center gap-2 rounded-2xl
                        border border-rose-200 bg-rose-50
                        px-4 py-3 text-xs font-extrabold
                        text-rose-800
                        dark:border-rose-400/20
                        dark:bg-rose-400/10 dark:text-rose-200
                      "
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Quantity exceeds storage stock
                    </div>
                  ) : (
                    <div
                      className="
                        inline-flex items-center gap-2 rounded-2xl
                        border border-emerald-200 bg-emerald-50
                        px-4 py-3 text-xs font-extrabold
                        text-emerald-800
                        dark:border-emerald-400/20
                        dark:bg-emerald-400/10
                        dark:text-emerald-200
                      "
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Stock level verified
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={LABEL_CLASS}>
                  <Calculator className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Quantity to Deduct *</span>
                </label>

                <input
                  type="number"
                  min={1}
                  required
                  placeholder="e.g. 2"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value),
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Reason Category *</span>
                </label>

                <select
                  required
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value as
                        | "Damage"
                        | "Loss"
                        | "Free Sample"
                        | "Other",
                    )
                  }
                  className={INPUT_CLASS}
                >
                  <option value="Damage">
                    Damage (Unusable pages, defective prints)
                  </option>
                  <option value="Loss">
                    Loss (Theft, missing during transit)
                  </option>
                  <option value="Free Sample">
                    Free Sample (Marketing, teacher review copies)
                  </option>
                  <option value="Other">Other / Adjustments</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>
                  <Info className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Detailed Explanation / Notes</span>
                </label>

                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Specify the school, teacher sample, damage detail, loss report, or other reason..."
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-white/10">
              <button
                type="submit"
                disabled={
                  loading ||
                  !bookId ||
                  !quantity ||
                  Number(quantity) > availableStock
                }
                className="
                  inline-flex w-full items-center justify-center gap-2
                  rounded-2xl border border-amber-400
                  bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
                  px-6 py-3.5 text-sm font-extrabold
                  text-slate-950
                  shadow-[0_14px_32px_rgba(180,123,24,0.24)]
                  transition hover:-translate-y-0.5
                  hover:brightness-105
                  disabled:cursor-not-allowed disabled:opacity-50
                  disabled:hover:translate-y-0
                  dark:border-amber-300/40
                  dark:text-[#081827]
                  sm:w-auto
                "
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                ) : (
                  <PackageMinus className="h-4 w-4" />
                )}

                <span>Record Deduction</span>
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center rounded-2xl
                  border border-amber-300 bg-amber-50
                  text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-300
                "
              >
                <Info className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Deductions Audit
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Permanent transaction record
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300">
              Every damage, loss, sample distribution, or adjustment
              is recorded for audit purposes.
            </p>

            <ul className="mt-4 space-y-3 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">
              {[
                "Creates an irreversible Damage / Loss Register entry.",
                "Adds a negative Stock History transaction.",
                "Updates the selected location's live stock balance.",
                "Supports shrinkage and stock value loss reporting.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500 dark:bg-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center rounded-2xl
                  border border-rose-200 bg-rose-50
                  text-rose-700
                  dark:border-rose-400/20
                  dark:bg-rose-400/10 dark:text-rose-300
                "
              >
                <AlertCircle className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Current Selection
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Form summary
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <SummaryRow
                label="Book"
                value={selectedBook?.title || "Not selected"}
              />
              <SummaryRow
                label="Location"
                value={selectedLocation?.name || "Not selected"}
              />
              <SummaryRow
                label="Reason"
                value={reason}
              />
              <SummaryRow
                label="Available Stock"
                value={`${availableStock.toLocaleString()} units`}
                strong
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`${SUB_PANEL_CLASS} p-4`}>
      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {label}
      </span>

      <p
        className={`mt-1 break-words text-sm ${
          strong
            ? "font-mono font-extrabold text-amber-800 dark:text-amber-300"
            : "font-extrabold text-slate-950 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
