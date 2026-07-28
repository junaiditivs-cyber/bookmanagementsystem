import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Info,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { apiFetch } from "../api/http";

interface ReturnsViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (
    msg: string,
    type: "success" | "error",
  ) => void;
  preSelectedBookId?: string;
  preSelectedReturnMode?: "customer" | "publisher";
  onClearPreSelectedBookId?: () => void;
}

const PANEL_CLASS =
  "returns-panel rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_26px_78px_rgba(0,0,0,0.44)]";

const SOFT_PANEL_CLASS =
  "returns-soft-panel rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#10263c]";

const INPUT_CLASS =
  "returns-control h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-400 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10 dark:[color-scheme:dark]";

const TEXTAREA_CLASS =
  "returns-control min-h-[104px] w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-400 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10";

const LABEL_CLASS =
  "returns-readable mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-slate-100";

export default function ReturnsView({
  data,
  onRefresh,
  onShowNotification,
  preSelectedBookId,
  preSelectedReturnMode = "customer",
  onClearPreSelectedBookId,
}: ReturnsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "customer" | "publisher"
  >("customer");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);

  const [bookId, setBookId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [originalSale, setOriginalSale] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [publisherId, setPublisherId] = useState("");

  useEffect(() => {
    if (preSelectedBookId) {
      setBookId(preSelectedBookId);
      setActiveTab(preSelectedReturnMode);
    }
  }, [preSelectedBookId, preSelectedReturnMode]);

  const selectedBook = data.books.find(
    (book) => book.id === bookId,
  );

  useEffect(() => {
    if (selectedBook && activeTab === "publisher") {
      setPublisherId(selectedBook.publisher_id);
    }
  }, [bookId, selectedBook, activeTab]);

  const getAvailableStock = () => {
    if (!bookId || !locationId) return 0;

    const balance = data.stock_balances.find(
      (stockBalance) =>
        stockBalance.book_id === bookId &&
        stockBalance.location_id === locationId,
    );

    return balance ? balance.quantity : 0;
  };

  const availableStock = getAvailableStock();

  const handleCustomerReturn = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (!originalSale.trim() || !bookId || !locationId || !quantity || !reason) {
      onShowNotification(
        "Please fill in all required fields.",
        "error",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/customer-returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          original_sale_number: originalSale,
          customer_name: customerName,
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
          error.error || "Failed to log customer return.",
        );
      }

      onShowNotification(
        "Customer return registered successfully!",
        "success",
      );
      setQuantity("");
      setReason("");
      setNotes("");
      setOriginalSale("");
      setCustomerName("");

      if (onClearPreSelectedBookId) {
        onClearPreSelectedBookId();
      }

      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePublisherReturn = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (
      !publisherId ||
      !bookId ||
      !locationId ||
      !quantity ||
      !reason
    ) {
      onShowNotification(
        "Please fill in all required fields.",
        "error",
      );
      return;
    }

    if (Number(quantity) > availableStock) {
      onShowNotification(
        `Cannot return! Selected location only has ${availableStock} units of this book.`,
        "error",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch(
        "/api/publisher-returns",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            publisher_id: publisherId,
            book_id: bookId,
            location_id: locationId,
            quantity: Number(quantity),
            reason,
            notes,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error ||
            "Failed to log return to publisher.",
        );
      }

      onShowNotification(
        "Publisher return registered successfully!",
        "success",
      );
      setQuantity("");
      setReason("");
      setNotes("");

      if (onClearPreSelectedBookId) {
        onClearPreSelectedBookId();
      }

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
  const activePublishers = data.publishers.filter(
    (publisher) => publisher.status === "active",
  );

  const selectedLocation = data.locations.find(
    (location) => location.id === locationId,
  );

  const selectedPublisher = data.publishers.find(
    (publisher) => publisher.id === publisherId,
  );

  const exceedsAvailableStock =
    activeTab === "publisher" &&
    Boolean(quantity) &&
    Number(quantity) > availableStock;

  return (
    <div
      id="returns-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{`
        #returns-view .returns-readable {
          color: #0f172a !important;
        }

        #returns-view .returns-muted {
          color: #475569 !important;
        }

        #returns-view .returns-panel {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }

        #returns-view .returns-soft-panel {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        #returns-view .returns-control {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        #returns-view .returns-control::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        html.dark #returns-view .returns-readable {
          color: #f8fafc !important;
        }

        html.dark #returns-view .returns-muted {
          color: #cbd5e1 !important;
        }

        html.dark #returns-view .returns-panel {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
        }

        html.dark #returns-view .returns-soft-panel {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #returns-view .returns-control {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
          color: #ffffff !important;
        }

        html.dark #returns-view .returns-control::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        html.dark #returns-view option {
          background-color: #0f2236 !important;
          color: #ffffff !important;
        }
      `}</style>

      <section
        className="
          relative overflow-hidden rounded-[2rem]
          border border-amber-300 bg-white px-6 py-6
          shadow-[0_20px_60px_rgba(15,23,42,0.12)]
          dark:border-amber-300/20 dark:bg-[#081827]
          dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]
          sm:px-8 sm:py-7
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.09),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.13),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                grid h-14 w-14 shrink-0 place-items-center
                rounded-2xl border border-amber-300
                bg-amber-50 text-amber-800
                shadow-[0_12px_28px_rgba(180,123,24,0.16)]
                dark:border-amber-300/25
                dark:bg-amber-300/10 dark:text-amber-300
              "
            >
              <RotateCcw className="h-7 w-7" />
            </div>

            <div>
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300 bg-amber-50 px-3 py-1
                  text-[9px] font-black uppercase
                  tracking-[0.22em] text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-200
                "
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Returns ledger
              </div>

              <h1 className="returns-readable mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Returns Ledger Handling
              </h1>

              <p className="returns-muted mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Log books returned by customers or safely deduct and
                ship stock back to the correct publisher.
              </p>
            </div>
          </div>

          <div
            className="
              flex w-full rounded-2xl border border-slate-300
              bg-slate-100 p-1.5 shadow-sm
              dark:border-white/10 dark:bg-[#10263c]
              sm:w-auto
            "
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab("customer");
                setQuantity("");
              }}
              className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:flex-none ${
                activeTab === "customer"
                  ? "border border-amber-300 bg-white text-amber-900 shadow-sm dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200"
                  : "border border-transparent text-slate-700 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              Customer Return
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("publisher");
                setQuantity("");
              }}
              className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-extrabold transition sm:flex-none ${
                activeTab === "publisher"
                  ? "border border-amber-300 bg-white text-amber-900 shadow-sm dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200"
                  : "border border-transparent text-slate-700 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              Return to Publisher
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className={`${PANEL_CLASS} p-5 sm:p-7 xl:col-span-2`}>
          <div className="mb-6 border-b border-slate-200 pb-5 dark:border-white/10">
            <h2 className="returns-readable flex items-center gap-2 text-base font-extrabold text-slate-950 dark:text-[#f7ddb0]">
              {activeTab === "customer" ? (
                <RotateCcw className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              ) : (
                <ArrowLeftRight className="h-5 w-5 text-amber-700 dark:text-amber-300" />
              )}

              <span>
                {activeTab === "customer"
                  ? "Log Book Return from Customer"
                  : "Return Books to Publisher"}
              </span>
            </h2>

            <p className="returns-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {activeTab === "customer"
                ? "Returned units will be added back to the selected receiving location."
                : "Returned units will be removed from the selected source location."}
            </p>
          </div>

          {activeTab === "customer" ? (
            <form
              onSubmit={handleCustomerReturn}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldLabel
                  label="Return Date"
                  icon={Calendar}
                >
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className={INPUT_CLASS}
                  />
                </FieldLabel>

                <FieldLabel
                  label="Original Invoice Reference # *"
                  icon={Calculator}
                >
                  <input
                    type="text"
                    required
                    placeholder="e.g. SL-1001"
                    value={originalSale}
                    onChange={(event) =>
                      setOriginalSale(event.target.value)
                    }
                    className={INPUT_CLASS}
                  />
                </FieldLabel>

                <div className="sm:col-span-2">
                  <FieldLabel
                    label="Customer / School Name"
                    icon={User}
                  >
                    <input
                      type="text"
                      placeholder="e.g. Al-Noor School"
                      value={customerName}
                      onChange={(event) =>
                        setCustomerName(event.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </FieldLabel>
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel
                    label="Returned Book *"
                    icon={BookOpen}
                  >
                    <select
                      required
                      value={bookId}
                      onChange={(event) =>
                        setBookId(event.target.value)
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="">-- Select Book --</option>

                      {activeBooks.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} ({book.book_number})
                        </option>
                      ))}
                    </select>
                  </FieldLabel>
                </div>

                <FieldLabel
                  label="Receiving Warehouse Location *"
                  icon={Building2}
                >
                  <select
                    required
                    value={locationId}
                    onChange={(event) =>
                      setLocationId(event.target.value)
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="">
                      -- Choose Storage Location --
                    </option>

                    {activeLocations.map((location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.name} ({location.code})
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel
                  label="Returned Copy Qty *"
                  icon={Calculator}
                >
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 5"
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
                </FieldLabel>

                <div className="sm:col-span-2">
                  <FieldLabel
                    label="Reason for Return *"
                    icon={Info}
                  >
                    <input
                      type="text"
                      required
                      placeholder="e.g. Damaged covers, extra curriculum copies, over-ordered"
                      value={reason}
                      onChange={(event) =>
                        setReason(event.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </FieldLabel>
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>
                    <Info className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                    <span>Notes</span>
                  </label>

                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Additional receiving clerk specifications..."
                    className={TEXTAREA_CLASS}
                  />
                </div>
              </div>

              <SubmitSection
                loading={loading}
                disabled={loading}
                label="Log Customer Return"
                icon={RotateCcw}
              />
            </form>
          ) : (
            <form
              onSubmit={handlePublisherReturn}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldLabel
                  label="Return Date"
                  icon={Calendar}
                >
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className={INPUT_CLASS}
                  />
                </FieldLabel>

                <FieldLabel
                  label="Target Publisher *"
                  icon={Users}
                >
                  <select
                    required
                    value={publisherId}
                    onChange={(event) =>
                      setPublisherId(event.target.value)
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="">
                      -- Choose Publisher --
                    </option>

                    {activePublishers.map((publisher) => (
                      <option
                        key={publisher.id}
                        value={publisher.id}
                      >
                        {publisher.publisher_name}
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <div className="sm:col-span-2">
                  <FieldLabel
                    label="Book to Return *"
                    icon={BookOpen}
                  >
                    <select
                      required
                      value={bookId}
                      onChange={(event) =>
                        setBookId(event.target.value)
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="">
                        -- Select Book --
                      </option>

                      {activeBooks
                        .filter(
                          (book) =>
                            !publisherId ||
                            book.publisher_id ===
                              publisherId,
                        )
                        .map((book) => (
                          <option
                            key={book.id}
                            value={book.id}
                          >
                            {book.title} (
                            {book.book_number})
                          </option>
                        ))}
                    </select>
                  </FieldLabel>
                </div>

                <FieldLabel
                  label="Source Location *"
                  icon={Building2}
                >
                  <select
                    required
                    value={locationId}
                    onChange={(event) =>
                      setLocationId(event.target.value)
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="">
                      -- Select Source Location --
                    </option>

                    {activeLocations.map((location) => (
                      <option
                        key={location.id}
                        value={location.id}
                      >
                        {location.name} ({location.code})
                      </option>
                    ))}
                  </select>
                </FieldLabel>

                <FieldLabel
                  label="Quantity to Return *"
                  icon={Calculator}
                >
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 10"
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
                </FieldLabel>

                {bookId && locationId && (
                  <div
                    className={`${SOFT_PANEL_CLASS} sm:col-span-2 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between`}
                  >
                    <div>
                      <span className="returns-muted text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        Available Stock Before Return
                      </span>

                      <p className="returns-readable mt-1 font-mono text-base font-extrabold text-slate-950 dark:text-white">
                        {availableStock} Units Available
                      </p>

                      <p className="returns-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {selectedBook?.title ||
                          "Selected book"}{" "}
                        at{" "}
                        {selectedLocation?.name ||
                          "selected location"}
                      </p>
                    </div>

                    {exceedsAvailableStock ? (
                      <div
                        className="
                          inline-flex items-center gap-2
                          rounded-2xl border border-rose-200
                          bg-rose-50 px-4 py-3
                          text-xs font-extrabold
                          text-rose-800
                          dark:border-rose-400/20
                          dark:bg-rose-400/10
                          dark:text-rose-200
                        "
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Insufficient stock
                      </div>
                    ) : (
                      <div
                        className="
                          inline-flex items-center gap-2
                          rounded-2xl border
                          border-emerald-200
                          bg-emerald-50 px-4 py-3
                          text-xs font-extrabold
                          text-emerald-800
                          dark:border-emerald-400/20
                          dark:bg-emerald-400/10
                          dark:text-emerald-200
                        "
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Stock verified
                      </div>
                    )}
                  </div>
                )}

                <div className="sm:col-span-2">
                  <FieldLabel
                    label="Reason for Return *"
                    icon={Info}
                  >
                    <input
                      type="text"
                      required
                      placeholder="e.g. Defective binding, misprints, expired consignment"
                      value={reason}
                      onChange={(event) =>
                        setReason(event.target.value)
                      }
                      className={INPUT_CLASS}
                    />
                  </FieldLabel>
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>
                    <Info className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                    <span>Notes</span>
                  </label>

                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Shipment details, return authorization slip numbers..."
                    className={TEXTAREA_CLASS}
                  />
                </div>
              </div>

              <SubmitSection
                loading={loading}
                disabled={
                  loading ||
                  !quantity ||
                  Number(quantity) > availableStock
                }
                label="Ship Return to Publisher"
                icon={ArrowLeftRight}
              />
            </form>
          )}
        </section>

        <aside className="space-y-6">
          <section className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center
                  rounded-2xl border border-amber-300
                  bg-amber-50 text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10
                  dark:text-amber-300
                "
              >
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h3 className="returns-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Workflow Verification
                </h3>

                <p className="returns-muted text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Current return behavior
                </p>
              </div>
            </div>

            <p className="returns-muted mt-4 text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300">
              {activeTab === "customer"
                ? "When a school or individual customer returns book stock, those units are re-added directly to the selected live storage balance. An audit trail is registered under customer returns."
                : "Publisher returns are guarded. The system does not allow a return quantity greater than the book stock physically available at the selected source location."}
            </p>
          </section>

          <section className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center
                  rounded-2xl border border-blue-200
                  bg-blue-50 text-blue-700
                  dark:border-blue-400/20
                  dark:bg-blue-400/10
                  dark:text-blue-300
                "
              >
                <BookOpen className="h-5 w-5" />
              </div>

              <div>
                <h3 className="returns-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Current Selection
                </h3>

                <p className="returns-muted text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Live form summary
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <SummaryRow
                label="Return Type"
                value={
                  activeTab === "customer"
                    ? "Customer Return"
                    : "Publisher Return"
                }
              />

              <SummaryRow
                label="Book"
                value={
                  selectedBook?.title || "Not selected"
                }
              />

              <SummaryRow
                label="Location"
                value={
                  selectedLocation?.name ||
                  "Not selected"
                }
              />

              {activeTab === "publisher" && (
                <>
                  <SummaryRow
                    label="Publisher"
                    value={
                      selectedPublisher?.publisher_name ||
                      "Not selected"
                    }
                  />

                  <SummaryRow
                    label="Available Stock"
                    value={`${availableStock.toLocaleString()} units`}
                    strong
                  />
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        <Icon className="h-4 w-4 text-amber-700 dark:text-amber-300" />
        <span>{label}</span>
      </label>

      {children}
    </div>
  );
}

function SubmitSection({
  loading,
  disabled,
  label,
  icon: Icon,
}: {
  loading: boolean;
  disabled: boolean;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-white/10">
      <button
        type="submit"
        disabled={disabled}
        className="
          inline-flex w-full items-center justify-center
          gap-2 rounded-2xl border border-amber-400
          bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
          px-6 py-3.5 text-sm font-extrabold
          text-slate-950
          shadow-[0_14px_32px_rgba(180,123,24,0.24)]
          transition hover:-translate-y-0.5
          hover:brightness-105
          disabled:cursor-not-allowed
          disabled:opacity-50
          disabled:hover:translate-y-0
          dark:border-amber-300/40
          dark:text-[#081827]
          sm:w-auto
        "
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
        ) : (
          <Icon className="h-4 w-4" />
        )}

        <span>{label}</span>
      </button>
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
    <div className={`${SOFT_PANEL_CLASS} p-4`}>
      <span className="returns-muted block text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {label}
      </span>

      <p
        className={`returns-readable mt-1 break-words text-sm ${
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