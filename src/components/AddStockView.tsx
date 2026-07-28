import React, { useEffect, useMemo, useState } from "react";
import {
  PackagePlus,
  Calendar,
  BookOpen,
  Building2,
  Calculator,
  Info,
  Plus,
  Trash2,
  Layers,
  Users,
  FileText,
  ReceiptText,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { apiFetch } from "../api/http";

const ADD_STOCK_VIEW_THEME_GUARD = `
html.dark #add-stock-view {
  color: #e8eef7 !important;
}
html.dark #add-stock-view [class*="text-slate-"] {
  color: #d9e4ef !important;
}
html.dark #add-stock-view [class*="dark:text-white"] {
  color: #ffffff !important;
}
html.dark #add-stock-view [class*="dark:text-[#f7ddb0]"] {
  color: #f7ddb0 !important;
}
html.dark #add-stock-view [class*="dark:text-[#081827]"] {
  color: #081827 !important;
}
html.dark #add-stock-view [class*="dark:text-amber-"] {
  color: #f4d88a !important;
}
html.dark #add-stock-view [class*="dark:text-blue-"] {
  color: #bfdbfe !important;
}
html.dark #add-stock-view [class*="dark:text-emerald-"] {
  color: #a7f3d0 !important;
}
html.dark #add-stock-view [class*="dark:text-rose-"] {
  color: #fecdd3 !important;
}
html.dark #add-stock-view [class*="dark:bg-white/"] ,
html.dark #add-stock-view [class*="dark:bg-white["] ,
html.dark #add-stock-view [class*="bg-white/"] {
  background-color: #10263c !important;
}
html.dark #add-stock-view [class*="bg-slate-50"] {
  background-color: #10263c !important;
}
html.dark #add-stock-view [class*="dark:bg-[#081827]"] {
  background-color: #081827 !important;
}
html.dark #add-stock-view [class*="dark:bg-[#10263c]"] {
  background-color: #10263c !important;
}
html.dark #add-stock-view [class*="dark:bg-amber-"] {
  background-color: rgba(245, 208, 121, 0.12) !important;
}
html.dark #add-stock-view [class*="dark:bg-blue-"] {
  background-color: rgba(59, 130, 246, 0.14) !important;
}
html.dark #add-stock-view [class*="dark:bg-emerald-"] {
  background-color: rgba(16, 185, 129, 0.14) !important;
}
html.dark #add-stock-view [class*="dark:bg-rose-"] {
  background-color: rgba(244, 63, 94, 0.14) !important;
}
html.dark #add-stock-view [class*="border-white/"] {
  border-color: rgba(247, 221, 176, 0.22) !important;
}
html.dark #add-stock-view input,
html.dark #add-stock-view select,
html.dark #add-stock-view textarea {
  background-color: #10263c !important;
  color: #ffffff !important;
  border-color: rgba(247, 221, 176, 0.34) !important;
  caret-color: #f7ddb0 !important;
}
html.dark #add-stock-view input::placeholder,
html.dark #add-stock-view textarea::placeholder {
  color: #a9b8c8 !important;
  opacity: 1 !important;
}
html.dark #add-stock-view select option {
  background-color: #10263c !important;
  color: #ffffff !important;
}
html:not(.dark) #add-stock-view {
  color: #0f172a !important;
}
html:not(.dark) #add-stock-view [class*="bg-white/"] {
  background-color: #ffffff !important;
}
html:not(.dark) #add-stock-view [class*="border-white/"] {
  border-color: #cbd5e1 !important;
}
html:not(.dark) #add-stock-view input,
html:not(.dark) #add-stock-view select,
html:not(.dark) #add-stock-view textarea {
  background-color: #ffffff !important;
  color: #0f172a !important;
  border-color: #cbd5e1 !important;
}
html:not(.dark) #add-stock-view input::placeholder,
html:not(.dark) #add-stock-view textarea::placeholder {
  color: #64748b !important;
  opacity: 1 !important;
}
`;

interface AddStockViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
  preSelectedBookId?: string;
  onClearPreSelectedBookId?: () => void;
}

type PurchaseType = "single" | "set";

type StockItemDraft = {
  book_id: string;
  quantity: number | "";
  unit_cost: number | "";
  sale_price: number | "";
};

const createEmptyStockItem = (): StockItemDraft => ({
  book_id: "",
  quantity: "",
  unit_cost: "",
  sale_price: "",
});

const INPUT_CLASS =
  "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10 dark:[color-scheme:dark]";

const TEXTAREA_CLASS =
  "min-h-[92px] w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10";

const PANEL_CLASS =
  "rounded-[2rem] border border-slate-200/90 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-amber-300/15 dark:bg-[#081827]/95 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]";

const SOFT_PANEL_CLASS =
  "rounded-2xl border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/[0.04]";

const LABEL_CLASS =
  "mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-800 dark:text-slate-200";

export default function AddStockView({
  data,
  onRefresh,
  onShowNotification,
  preSelectedBookId,
  onClearPreSelectedBookId,
}: AddStockViewProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedPublisherId, setSelectedPublisherId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("single");
  const [setName, setSetName] = useState("");
  const [stockItems, setStockItems] = useState<StockItemDraft[]>([
    createEmptyStockItem(),
    createEmptyStockItem(),
  ]);
  const [quantity, setQuantity] = useState<number | "">("");
  const [unitCost, setUnitCost] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const activePublishers = useMemo(() => {
    return data.publishers.filter((publisher) => publisher.status === "active");
  }, [data.publishers]);

  const activeBooks = useMemo(() => {
    return data.books.filter((book) => book.status === "active");
  }, [data.books]);

  const activeLocations = useMemo(() => {
    return data.locations.filter((location) => location.status === "active");
  }, [data.locations]);

  const booksForSelectedPublisher = useMemo(() => {
    if (!selectedPublisherId) return activeBooks;

    return activeBooks.filter((book) => book.publisher_id === selectedPublisherId);
  }, [activeBooks, selectedPublisherId]);

  const getBooksForSetRow = (currentIndex: number) => {
    const currentBookId = stockItems[currentIndex]?.book_id || "";

    const selectedBookIds = new Set(
      stockItems
        .map((item, itemIndex) => {
          if (itemIndex === currentIndex) return "";

          return item.book_id;
        })
        .filter(Boolean),
    );

    return booksForSelectedPublisher.filter((book) => {
      return book.id === currentBookId || !selectedBookIds.has(book.id);
    });
  };

  const selectedBook = data.books.find((book) => book.id === selectedBookId);

  const selectedPublisher = selectedPublisherId
    ? data.publishers.find((publisher) => publisher.id === selectedPublisherId)
    : selectedBook
      ? data.publishers.find((publisher) => publisher.id === selectedBook.publisher_id)
      : null;

  const selectedLocation = data.locations.find(
    (location) => location.id === selectedLocationId,
  );

  const singleTotal =
    selectedBook && quantity
      ? Number(quantity) * Number(unitCost || selectedBook.purchase_cost || 0)
      : 0;

  const setTotal = stockItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 0) * Number(item.unit_cost || 0);
  }, 0);

  const setTotalQuantity = stockItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  useEffect(() => {
    if (!preSelectedBookId) return;

    const book = data.books.find((item) => item.id === preSelectedBookId);

    setPurchaseType("single");
    setSelectedBookId(preSelectedBookId);

    if (book) {
      setSelectedPublisherId(book.publisher_id);
      setUnitCost(book.purchase_cost);
      setSalePrice(book.sale_price);
    }
  }, [preSelectedBookId, data.books]);

  useEffect(() => {
    if (selectedBook) {
      setUnitCost(selectedBook.purchase_cost);
      setSalePrice(selectedBook.sale_price);
    } else {
      setUnitCost("");
      setSalePrice("");
    }
  }, [selectedBookId, selectedBook]);

  useEffect(() => {
    if (data.locations.length > 0 && !selectedLocationId) {
      const defaultLoc =
        data.locations.find((location) => location.type === "warehouse") ||
        data.locations[0];

      setSelectedLocationId(defaultLoc.id);
    }
  }, [data.locations, selectedLocationId]);

  const handlePublisherChange = (publisherId: string) => {
    setSelectedPublisherId(publisherId);

    if (selectedBookId) {
      const currentBook = data.books.find((book) => book.id === selectedBookId);

      if (currentBook && currentBook.publisher_id !== publisherId) {
        setSelectedBookId("");
        setUnitCost("");
        setSalePrice("");
      }
    }

    setStockItems((currentItems) =>
      currentItems.map((item) => {
        if (!item.book_id) return item;

        const currentBook = data.books.find((book) => book.id === item.book_id);

        if (currentBook && currentBook.publisher_id === publisherId) {
          return item;
        }

        return {
          ...item,
          book_id: "",
          unit_cost: "",
          sale_price: "",
        };
      }),
    );
  };

  const handleSingleBookChange = (bookId: string) => {
    const book = data.books.find((item) => item.id === bookId);

    setSelectedBookId(bookId);

    if (book) {
      setSelectedPublisherId(book.publisher_id);
      setUnitCost(book.purchase_cost);
      setSalePrice(book.sale_price);
    }
  };

  const handleStockItemChange = (
    index: number,
    field: keyof StockItemDraft,
    value: string,
  ) => {
    setStockItems((currentItems) => {
      return currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "book_id") {
          const book = data.books.find((bookItem) => bookItem.id === value);

          return {
            ...item,
            book_id: value,
            unit_cost: book ? book.purchase_cost : "",
            sale_price: book ? book.sale_price : "",
          };
        }

        return {
          ...item,
          [field]: value === "" ? "" : Number(value),
        };
      });
    });
  };

  const addStockItemRow = () => {
    setStockItems((currentItems) => [...currentItems, createEmptyStockItem()]);
  };

  const removeStockItemRow = (index: number) => {
    setStockItems((currentItems) => {
      if (currentItems.length <= 2) {
        onShowNotification("A set/pair needs at least 2 book rows.", "error");
        return currentItems;
      }

      return currentItems.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const validateSetItems = () => {
    const completedItems = stockItems.filter(
      (item) =>
        item.book_id || item.quantity || item.unit_cost || item.sale_price !== "",
    );

    if (completedItems.length < 2) {
      throw new Error("Please add at least 2 books for a pair/set.");
    }

    const bookIds = new Set<string>();

    for (const item of completedItems) {
      if (!item.book_id) {
        throw new Error("Please select a book for every set/pair row.");
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        throw new Error(
          "Quantity must be greater than 0 for every set/pair book.",
        );
      }

      if (item.sale_price !== "" && Number(item.sale_price) < 0) {
        throw new Error("New sale price cannot be negative.");
      }

      if (bookIds.has(item.book_id)) {
        throw new Error(
          "The same book is selected more than once in the set/pair.",
        );
      }

      bookIds.add(item.book_id);
    }

    return completedItems.map((item) => ({
      book_id: item.book_id,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost) || 0,
      sale_price:
        item.sale_price === "" ? undefined : Number(item.sale_price),
    }));
  };

  const handleAddStock = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedPublisherId) {
      onShowNotification("Please select a publisher.", "error");
      return;
    }

    if (!selectedLocationId) {
      onShowNotification("Please select a storage location.", "error");
      return;
    }

    let items: {
      book_id: string;
      quantity: number;
      unit_cost: number;
      sale_price?: number;
    }[] = [];

    try {
      if (purchaseType === "single") {
        if (!selectedBookId) {
          throw new Error("Please select a book.");
        }

        if (!quantity || Number(quantity) <= 0) {
          throw new Error("Quantity must be greater than 0.");
        }

        if (salePrice !== "" && Number(salePrice) < 0) {
          throw new Error("New sale price cannot be negative.");
        }

        items = [
          {
            book_id: selectedBookId,
            quantity: Number(quantity),
            unit_cost:
              Number(unitCost) || selectedBook?.purchase_cost || 0,
            sale_price:
              salePrice === "" ? undefined : Number(salePrice),
          },
        ];
      } else {
        items = validateSetItems();
      }
    } catch (error: any) {
      onShowNotification(error.message, "error");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/add-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          publisher_id: selectedPublisherId,
          location_id: selectedLocationId,
          purchase_type: purchaseType,
          set_name: purchaseType === "set" ? setName : undefined,
          reference_number: reference,
          notes,
          items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add stock.");
      }

      const result = await response.json().catch(() => null);
      const updatedPriceCount = Number(
        result?.sale_price_updated_count || 0,
      );

      onShowNotification(
        updatedPriceCount > 0
          ? `Stock added successfully. Sale price updated for ${updatedPriceCount} book(s).`
          : "Stock added successfully!",
        "success",
      );

      setSelectedBookId("");
      setQuantity("");
      setUnitCost("");
      setSalePrice("");
      setSetName("");
      setReference("");
      setNotes("");
      setStockItems([createEmptyStockItem(), createEmptyStockItem()]);

      if (onClearPreSelectedBookId) onClearPreSelectedBookId();

      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="add-stock-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{ADD_STOCK_VIEW_THEME_GUARD}</style>

      <section
        className="
          relative overflow-hidden rounded-[2rem] border border-amber-200/80
          bg-[linear-gradient(135deg,#fffdf8_0%,#ffffff_52%,#eef4ff_100%)]
          px-6 py-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]
          dark:border-amber-300/15
          dark:bg-[linear-gradient(135deg,#081827_0%,#0b1f33_55%,#10263c_100%)]
          dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]
          sm:px-8 sm:py-7
        "
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full border border-amber-300/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                grid h-14 w-14 shrink-0 place-items-center rounded-2xl
                border border-amber-300/70 bg-white text-amber-700
                shadow-[0_12px_28px_rgba(180,123,24,0.15)]
                dark:border-amber-300/25 dark:bg-amber-300/10
                dark:text-amber-300
              "
            >
              <PackagePlus className="h-7 w-7" />
            </div>

            <div>
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300/70 bg-amber-50 px-3 py-1
                  text-[9px] font-black uppercase tracking-[0.22em]
                  text-amber-800
                  dark:border-amber-300/25 dark:bg-amber-300/10
                  dark:text-amber-200
                "
              >
                <Landmark className="h-3.5 w-3.5" />
                Publisher purchasing
              </div>

              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Purchase / Add Stock From Publisher
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                Buy books from publishers and receive stock into warehouse,
                shop, or school locations.
              </p>
            </div>
          </div>

          <div
            className="
              inline-flex items-center gap-2 self-start rounded-2xl
              border border-emerald-200 bg-emerald-50 px-4 py-3
              text-xs font-extrabold text-emerald-800
              dark:border-emerald-400/20 dark:bg-emerald-400/10
              dark:text-emerald-200 lg:self-center
            "
          >
            <ShieldCheck className="h-4 w-4" />
            Safe stock transaction
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${PANEL_CLASS} p-5 sm:p-7 xl:col-span-2`}>
          <form onSubmit={handleAddStock} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>
                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  <span>Purchase / Entry Date</span>
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
                  <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  <span>Receiving Location *</span>
                </label>

                <select
                  required
                  value={selectedLocationId}
                  onChange={(event) =>
                    setSelectedLocationId(event.target.value)
                  }
                  className={INPUT_CLASS}
                >
                  <option value="" disabled>
                    -- Select Warehouse / Shop / School --
                  </option>

                  {activeLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.type} - {location.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  <span>Publisher *</span>
                </label>

                <select
                  required
                  value={selectedPublisherId}
                  onChange={(event) =>
                    handlePublisherChange(event.target.value)
                  }
                  className={INPUT_CLASS}
                >
                  <option value="">-- Select Publisher --</option>

                  {activePublishers.map((publisher) => (
                    <option key={publisher.id} value={publisher.id}>
                      {publisher.publisher_name} (
                      {publisher.publisher_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>
                  <Layers className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  <span>Purchase Type</span>
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPurchaseType("single")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      purchaseType === "single"
                        ? "border-amber-400 bg-amber-50 text-amber-950 shadow-[0_10px_26px_rgba(180,123,24,0.12)] dark:border-amber-300/40 dark:bg-amber-300/10 dark:text-amber-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-amber-300/25 dark:hover:bg-amber-300/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-extrabold">
                      <BookOpen className="h-4 w-4" />
                      <span>Single Book</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 opacity-75">
                      Add stock for one selected book.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseType("set")}
                    className={`rounded-2xl border p-4 text-left transition ${
                      purchaseType === "set"
                        ? "border-amber-400 bg-amber-50 text-amber-950 shadow-[0_10px_26px_rgba(180,123,24,0.12)] dark:border-amber-300/40 dark:bg-amber-300/10 dark:text-amber-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-amber-300/25 dark:hover:bg-amber-300/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-extrabold">
                      <Layers className="h-4 w-4" />
                      <span>Pair / Set / Bundle</span>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 opacity-75">
                      Add 2, 3, or more books together.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {purchaseType === "single" && (
              <div className={`${SOFT_PANEL_CLASS} p-4 sm:p-5`}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={LABEL_CLASS}>
                      <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                      <span>Select Book *</span>
                    </label>

                    <select
                      required={purchaseType === "single"}
                      value={selectedBookId}
                      onChange={(event) =>
                        handleSingleBookChange(event.target.value)
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="">-- Choose Registered Book --</option>

                      {booksForSelectedPublisher.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} ({book.book_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBook && (
                    <div
                      className="
                        grid grid-cols-1 gap-4 rounded-2xl border
                        border-slate-200 bg-white p-4
                        dark:border-white/10 dark:bg-white/[0.04]
                        sm:col-span-2 sm:grid-cols-2
                      "
                    >
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Book Publisher
                        </span>
                        <p className="mt-1 text-sm font-extrabold text-slate-950 dark:text-white">
                          {selectedPublisher
                            ? selectedPublisher.publisher_name
                            : "N/A"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Book Code
                        </span>
                        <p className="mt-1 font-mono text-sm font-extrabold text-amber-700 dark:text-amber-300">
                          {selectedBook.book_number}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={LABEL_CLASS}>
                      <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                      <span>Quantity to Add *</span>
                    </label>

                    <input
                      type="number"
                      min={1}
                      required={purchaseType === "single"}
                      placeholder="e.g. 50"
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
                      <ReceiptText className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                      <span>Unit Cost (PKR)</span>
                    </label>

                    <input
                      type="number"
                      min={0}
                      value={unitCost}
                      onChange={(event) =>
                        setUnitCost(
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        )
                      }
                      placeholder="Purchase unit cost"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div
                    className="
                      rounded-2xl border border-blue-200 bg-blue-50 p-4
                      text-blue-950 dark:border-blue-400/20
                      dark:bg-blue-400/10 dark:text-blue-100
                      sm:col-span-2
                    "
                  >
                    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          Current Sale Price
                        </p>
                        <p className="mt-1 font-mono text-lg font-extrabold text-slate-950 dark:text-white">
                          PKR{" "}
                          {Number(
                            selectedBook?.sale_price || 0,
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-extrabold text-blue-950 dark:text-blue-100">
                          New Sale Price (PKR)
                        </label>

                        <input
                          type="number"
                          min={0}
                          value={salePrice}
                          onChange={(event) =>
                            setSalePrice(
                              event.target.value === ""
                                ? ""
                                : Number(event.target.value),
                            )
                          }
                          placeholder="Enter new selling price"
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-semibold leading-5 text-blue-800 dark:text-blue-200">
                      Saving this stock entry will replace the book&apos;s
                      current sale price with the new price entered above.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {purchaseType === "set" && (
              <div className={`${SOFT_PANEL_CLASS} space-y-4 p-4 sm:p-5`}>
                <div>
                  <label className={LABEL_CLASS}>
                    <Layers className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                    <span>Set / Pair Name</span>
                  </label>

                  <input
                    type="text"
                    value={setName}
                    onChange={(event) => setSetName(event.target.value)}
                    placeholder="e.g. Class 5 English Set"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="space-y-3">
                  {stockItems.map((item, index) => {
                    const selectedItemBook = data.books.find(
                      (book) => book.id === item.book_id,
                    );

                    return (
                      <div
                        key={index}
                        className="
                          rounded-2xl border border-slate-200 bg-white p-4
                          shadow-sm dark:border-white/10
                          dark:bg-white/[0.04]
                        "
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                            Book Row {index + 1}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeStockItemRow(index)}
                            className="
                              inline-flex items-center gap-1 rounded-xl
                              border border-rose-200 bg-rose-50 px-3 py-2
                              text-[10px] font-extrabold text-rose-700
                              transition hover:bg-rose-100
                              dark:border-rose-400/20
                              dark:bg-rose-400/10 dark:text-rose-200
                            "
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <div className="sm:col-span-5">
                            <label className="mb-2 block text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                              Book *
                            </label>

                            <select
                              value={item.book_id}
                              onChange={(event) =>
                                handleStockItemChange(
                                  index,
                                  "book_id",
                                  event.target.value,
                                )
                              }
                              className={INPUT_CLASS}
                            >
                              <option value="">-- Select Book --</option>

                              {getBooksForSetRow(index).map((book) => (
                                <option key={book.id} value={book.id}>
                                  {book.title} ({book.book_number})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="mb-2 block text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                              Quantity *
                            </label>

                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(event) =>
                                handleStockItemChange(
                                  index,
                                  "quantity",
                                  event.target.value,
                                )
                              }
                              className={INPUT_CLASS}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="mb-2 block text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                              Unit Cost
                            </label>

                            <input
                              type="number"
                              min={0}
                              value={item.unit_cost}
                              onChange={(event) =>
                                handleStockItemChange(
                                  index,
                                  "unit_cost",
                                  event.target.value,
                                )
                              }
                              className={INPUT_CLASS}
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="mb-2 block text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                              New Sale Price
                            </label>

                            <input
                              type="number"
                              min={0}
                              value={item.sale_price}
                              onChange={(event) =>
                                handleStockItemChange(
                                  index,
                                  "sale_price",
                                  event.target.value,
                                )
                              }
                              placeholder={
                                selectedItemBook
                                  ? `Current: ${selectedItemBook.sale_price}`
                                  : "New price"
                              }
                              className={INPUT_CLASS}
                            />
                          </div>
                        </div>

                        {selectedItemBook && (
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            <p>
                              Selected:{" "}
                              <span className="font-extrabold text-slate-950 dark:text-white">
                                {selectedItemBook.title}
                              </span>
                            </p>

                            <p>
                              Current Sale Price:{" "}
                              <span className="font-mono font-extrabold text-blue-700 dark:text-blue-300">
                                PKR{" "}
                                {Number(
                                  selectedItemBook.sale_price || 0,
                                ).toLocaleString()}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={addStockItemRow}
                  className="
                    inline-flex items-center gap-2 rounded-2xl
                    border border-slate-300 bg-white px-4 py-3
                    text-xs font-extrabold text-slate-800 shadow-sm
                    transition hover:border-amber-400 hover:bg-amber-50
                    hover:text-amber-800
                    dark:border-white/15 dark:bg-white/[0.05]
                    dark:text-slate-200 dark:hover:border-amber-300/30
                    dark:hover:bg-amber-300/10
                    dark:hover:text-amber-200
                  "
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Book</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={LABEL_CLASS}>
                  <FileText className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  <span>Supplier Reference / Invoice #</span>
                </label>

                <input
                  type="text"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="e.g. INVOICE-881"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  <span>Receiving Notes</span>
                </label>

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Describe damage, transit details, or batch specifications..."
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="
                  inline-flex w-full items-center justify-center gap-2
                  rounded-2xl border border-amber-400
                  bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
                  px-6 py-3.5 text-sm font-extrabold text-slate-950
                  shadow-[0_14px_32px_rgba(180,123,24,0.24)]
                  transition hover:-translate-y-0.5 hover:brightness-105
                  disabled:cursor-not-allowed disabled:opacity-50
                  disabled:hover:translate-y-0
                  dark:border-amber-300/40 dark:text-[#081827]
                  sm:w-auto
                "
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}

                <span>Receive & Add Stock</span>
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center rounded-2xl
                  border border-amber-300 bg-amber-50 text-amber-700
                  dark:border-amber-300/25 dark:bg-amber-300/10
                  dark:text-amber-300
                "
              >
                <ReceiptText className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Purchase Summary
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Live values from this form
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <SummaryRow
                label="Publisher"
                value={
                  selectedPublisher
                    ? selectedPublisher.publisher_name
                    : "Not selected"
                }
              />

              <SummaryRow
                label="Location"
                value={
                  selectedLocation
                    ? `${selectedLocation.name} (${selectedLocation.type})`
                    : "Not selected"
                }
              />

              <SummaryRow
                label="Estimated Total"
                value={`PKR ${(
                  purchaseType === "single" ? singleTotal : setTotal
                ).toLocaleString()}`}
                strong
              />

              {purchaseType === "set" && (
                <SummaryRow
                  label="Set Total Quantity"
                  value={`${setTotalQuantity.toLocaleString()} units`}
                />
              )}
            </div>
          </div>

          <div className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center rounded-2xl
                  border border-emerald-200 bg-emerald-50 text-emerald-700
                  dark:border-emerald-400/20 dark:bg-emerald-400/10
                  dark:text-emerald-300
                "
              >
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Safe Stock Keeping
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  What happens after saving
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300">
              When you click <b>Receive & Add Stock</b>:
            </p>

            <ul className="mt-3 space-y-3 text-xs font-semibold leading-5 text-slate-700 dark:text-slate-300">
              {[
                "Each book creates a permanent Stock Entry record.",
                "A read-only Stock History transaction is linked.",
                "The Available Stock balance for this location increases.",
                "Pair/set purchases increase stock book-by-book.",
                "Entered new sale prices replace the books’ current sale prices.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500 dark:bg-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
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
    <div className={SOFT_PANEL_CLASS + " p-4"}>
      <span className="block text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <p
        className={`mt-1 break-words text-sm ${
          strong
            ? "font-mono font-extrabold text-amber-700 dark:text-amber-300"
            : "font-extrabold text-slate-950 dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
