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
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { apiFetch } from "../api/http";

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
        .filter(Boolean)
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

  const selectedLocation = data.locations.find((location) => location.id === selectedLocationId);

  const singleTotal = selectedBook && quantity
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
      const defaultLoc = data.locations.find((location) => location.type === "warehouse") || data.locations[0];

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
      })
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

  const handleStockItemChange = (index: number, field: keyof StockItemDraft, value: string) => {
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
      (item) => item.book_id || item.quantity || item.unit_cost || item.sale_price !== ""
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
        throw new Error("Quantity must be greater than 0 for every set/pair book.");
      }

      if (item.sale_price !== "" && Number(item.sale_price) < 0) {
        throw new Error("New sale price cannot be negative.");
      }

      if (bookIds.has(item.book_id)) {
        throw new Error("The same book is selected more than once in the set/pair.");
      }

      bookIds.add(item.book_id);
    }

    return completedItems.map((item) => ({
      book_id: item.book_id,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unit_cost) || 0,
      sale_price: item.sale_price === "" ? undefined : Number(item.sale_price),
    }));
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();

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
            unit_cost: Number(unitCost) || selectedBook?.purchase_cost || 0,
            sale_price: salePrice === "" ? undefined : Number(salePrice),
          },
        ];
      } else {
        items = validateSetItems();
      }
    } catch (err: any) {
      onShowNotification(err.message, "error");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/add-stock", {
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add stock.");
      }

      const result = await res.json().catch(() => null);
      const updatedPriceCount = Number(result?.sale_price_updated_count || 0);

      onShowNotification(
        updatedPriceCount > 0
          ? `Stock added successfully. Sale price updated for ${updatedPriceCount} book(s).`
          : "Stock added successfully!",
        "success"
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
    } catch (err: any) {
      onShowNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-stock-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      <div className="border-b border-slate-200/60 pb-5">
        <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-rose-500" />
          <span>Purchase / Add Stock From Publisher</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
          Buy books from publishers and receive stock into warehouse, shop, or school locations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel border border-white/60 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleAddStock} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Purchase / Entry Date</span>
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
                  <span>Receiving Location *</span>
                </label>
                <select
                  required
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
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
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Publisher *</span>
                </label>
                <select
                  required
                  value={selectedPublisherId}
                  onChange={(e) => handlePublisherChange(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                >
                  <option value="">-- Select Publisher --</option>
                  {activePublishers.map((publisher) => (
                    <option key={publisher.id} value={publisher.id}>
                      {publisher.publisher_name} ({publisher.publisher_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Purchase Type</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPurchaseType("single")}
                    className={`rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                      purchaseType === "single"
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Single Book</span>
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      Add stock for one selected book.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseType("set")}
                    className={`rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                      purchaseType === "set"
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>Pair / Set / Bundle</span>
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      Add 2, 3, or more books together.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {purchaseType === "single" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Select Book *</span>
                  </label>
                  <select
                    required={purchaseType === "single"}
                    value={selectedBookId}
                    onChange={(e) => handleSingleBookChange(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
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
                  <div className="sm:col-span-2 bg-white border border-slate-100 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Book Publisher</span>
                      <p className="text-slate-800 font-bold mt-0.5 text-xs">
                        {selectedPublisher ? selectedPublisher.publisher_name : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Book Code</span>
                      <p className="text-rose-500 font-mono font-extrabold mt-0.5 text-xs">
                        {selectedBook.book_number}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quantity to Add *</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required={purchaseType === "single"}
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Unit Cost (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Purchase unit cost"
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-blue-500">
                        Current Sale Price
                      </p>
                      <p className="mt-1 font-mono text-sm font-extrabold text-slate-800">
                        PKR {Number(selectedBook?.sale_price || 0).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        New Sale Price (PKR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Enter new selling price"
                        className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-[10px] font-semibold text-blue-600">
                    Saving this stock entry will replace the book&apos;s current sale price with the new price entered above.
                  </p>
                </div>
              </div>
            )}

            {purchaseType === "set" && (
              <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Set / Pair Name</span>
                  </label>
                  <input
                    type="text"
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    placeholder="e.g. Class 5 English Set"
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  {stockItems.map((item, index) => {
                    const selectedItemBook = data.books.find((book) => book.id === item.book_id);

                    return (
                      <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                            Book Row {index + 1}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeStockItemRow(index)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-100 px-2 py-1 text-[10px] font-bold text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Book *</label>
                            <select
                              value={item.book_id}
                              onChange={(e) => handleStockItemChange(index, "book_id", e.target.value)}
                              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
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
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Quantity *</label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleStockItemChange(index, "quantity", e.target.value)}
                              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">Unit Cost</label>
                            <input
                              type="number"
                              min={0}
                              value={item.unit_cost}
                              onChange={(e) => handleStockItemChange(index, "unit_cost", e.target.value)}
                              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1">
                              New Sale Price
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={item.sale_price}
                              onChange={(e) => handleStockItemChange(index, "sale_price", e.target.value)}
                              placeholder={selectedItemBook ? `Current: ${selectedItemBook.sale_price}` : "New price"}
                              className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        {selectedItemBook && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-400">
                            <p>
                              Selected: <span className="text-slate-600">{selectedItemBook.title}</span>
                            </p>
                            <p>
                              Current Sale Price:{" "}
                              <span className="font-mono font-extrabold text-blue-600">
                                PKR {Number(selectedItemBook.sale_price || 0).toLocaleString()}
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Book</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Supplier Reference / Invoice #</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. INVOICE-881"
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Receiving Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe damage, transit details, or batch specifications..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Plus className="w-4 h-4 text-white" />
                )}
                <span>Receive & Add Stock</span>
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-panel border border-white/60 rounded-2xl p-5 text-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2.5">
              <Info className="w-4 h-4 text-rose-500" />
              <span>Purchase Summary</span>
            </h3>

            <div className="space-y-3 text-[11px] font-semibold text-slate-500">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="block text-[10px] uppercase font-extrabold text-slate-400">Publisher</span>
                <p className="mt-0.5 text-slate-700">
                  {selectedPublisher ? selectedPublisher.publisher_name : "Not selected"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="block text-[10px] uppercase font-extrabold text-slate-400">Location</span>
                <p className="mt-0.5 text-slate-700">
                  {selectedLocation ? `${selectedLocation.name} (${selectedLocation.type})` : "Not selected"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="block text-[10px] uppercase font-extrabold text-slate-400">Estimated Total</span>
                <p className="mt-0.5 text-slate-700">
                  PKR {(purchaseType === "single" ? singleTotal : setTotal).toLocaleString()}
                </p>
              </div>

              {purchaseType === "set" && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="block text-[10px] uppercase font-extrabold text-slate-400">Set Total Quantity</span>
                  <p className="mt-0.5 text-slate-700">{setTotalQuantity.toLocaleString()} units</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel border border-white/60 rounded-2xl p-5 text-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2.5">
              <Info className="w-4 h-4 text-rose-500" />
              <span>Safe Stock Keeping</span>
            </h3>
            <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">
              When you click <b>Receive & Add Stock</b>:
            </p>
            <ul className="list-disc list-inside text-[11px] text-slate-500 mt-2 space-y-1.5 pl-1 font-medium">
              <li>Each book creates a permanent <b className="text-slate-700">Stock Entry record</b>.</li>
              <li>A read-only <b className="text-slate-700">Stock History transaction</b> is linked.</li>
              <li>The <b className="text-slate-700">Available Stock balance</b> for this location increases.</li>
              <li>Pair/set purchases increase stock book-by-book.</li>
              <li>Entered new sale prices replace the books&apos; current sale prices.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}