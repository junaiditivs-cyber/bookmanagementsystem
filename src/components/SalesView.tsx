import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Calendar,
  Building2,
  BookOpen,
  Calculator,
  Info,
  Layers,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  X,
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { apiFetch } from "../api/http";

interface SalesViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
  preSelectedBookId?: string;
  onClearPreSelectedBookId?: () => void;
}

type SaleType = "single_book" | "grade_set";

export default function SalesView({
  data,
  onRefresh,
  onShowNotification,
  preSelectedBookId,
  onClearPreSelectedBookId,
}: SalesViewProps) {
  const [saleType, setSaleType] = useState<SaleType>("single_book");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [locationId, setLocationId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [bookId, setBookId] = useState("");
  const [singleQuantity, setSingleQuantity] = useState<number | "">("");
  const [gradeSetQuantity, setGradeSetQuantity] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [selectedGradeSetBookIds, setSelectedGradeSetBookIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const activeBooks = useMemo(() => {
    return data.books.filter((book) => book.status === "active");
  }, [data.books]);

  const activeLocations = useMemo(() => {
    return data.locations.filter((location) => location.status === "active");
  }, [data.locations]);

  const activeGrades = useMemo(() => {
    return data.classes.filter((grade) => grade.status === "active");
  }, [data.classes]);

  const selectedBook = activeBooks.find((book) => book.id === bookId);
  const selectedGrade = activeGrades.find((grade) => grade.id === gradeId);

  useEffect(() => {
    if (data.locations.length > 0 && !locationId) {
      const defaultLocation =
        data.locations.find((location) => location.type?.toLowerCase() === "shop") ||
        data.locations[0];

      setLocationId(defaultLocation.id);
    }
  }, [data.locations, locationId]);

  useEffect(() => {
    if (!preSelectedBookId) return;

    const book = activeBooks.find((item) => item.id === preSelectedBookId);

    setSaleType("single_book");
    setBookId(preSelectedBookId);

    if (book) {
      setGradeId(book.class_id);
      setSalePrice(book.sale_price);
    }
  }, [activeBooks, preSelectedBookId]);

  useEffect(() => {
    if (selectedBook) {
      setSalePrice(selectedBook.sale_price);
    } else {
      setSalePrice("");
    }
  }, [selectedBook]);

  const getBookStockAtLocation = (targetBookId: string) => {
    if (!targetBookId || !locationId) return 0;

    const balance = data.stock_balances.find((stockBalance) => {
      return stockBalance.book_id === targetBookId && stockBalance.location_id === locationId;
    });

    return balance ? Number(balance.quantity || 0) : 0;
  };

  const singleBookAvailableStock = selectedBook ? getBookStockAtLocation(selectedBook.id) : 0;

  const booksForSingleSale = useMemo(() => {
    if (!gradeId) return activeBooks;

    return activeBooks.filter((book) => book.class_id === gradeId);
  }, [activeBooks, gradeId]);

  const gradeSetBooks = useMemo(() => {
    if (!gradeId) return [];

    return activeBooks.filter((book) => book.class_id === gradeId);
  }, [activeBooks, gradeId]);

  useEffect(() => {
    if (saleType !== "grade_set") return;

    setSelectedGradeSetBookIds(gradeSetBooks.map((book) => book.id));
  }, [gradeSetBooks, saleType]);

  const gradeSetRows = useMemo(() => {
    return gradeSetBooks.map((book) => {
      const availableStock = getBookStockAtLocation(book.id);

      return {
        book,
        availableStock,
        salePrice: Number(book.sale_price || 0),
      };
    });
  }, [gradeSetBooks, locationId, data.stock_balances]);

  const selectedGradeSetRows = useMemo(() => {
    return gradeSetRows.filter((row) =>
      selectedGradeSetBookIds.includes(row.book.id)
    );
  }, [gradeSetRows, selectedGradeSetBookIds]);

  const availableCompleteSets = useMemo(() => {
    if (selectedGradeSetRows.length === 0) return 0;

    return Math.min(...selectedGradeSetRows.map((row) => row.availableStock));
  }, [selectedGradeSetRows]);

  const singleBookTotal = useMemo(() => {
    if (!singleQuantity || !salePrice) return 0;

    return Number(singleQuantity) * Number(salePrice);
  }, [singleQuantity, salePrice]);

  const oneSetPrice = useMemo(() => {
    return selectedGradeSetRows.reduce((sum, row) => sum + row.salePrice, 0);
  }, [selectedGradeSetRows]);

  const gradeSetTotal = useMemo(() => {
    if (!gradeSetQuantity) return 0;

    return Number(gradeSetQuantity) * oneSetPrice;
  }, [gradeSetQuantity, oneSetPrice]);

  const postSingleSaleToServer = async ({
    targetBookId,
    targetQuantity,
    targetSalePrice,
    notes,
  }: {
    targetBookId: string;
    targetQuantity: number;
    targetSalePrice: number;
    notes: string;
  }) => {
    const response = await apiFetch("/api/sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        location_id: locationId,
        customer_name: "",
        book_id: targetBookId,
        quantity: targetQuantity,
        sale_price: targetSalePrice,
        discount: 0,
        payment_method: "Cash",
        notes,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || "Failed to record sale.");
    }

    return result;
  };

  const handleSingleBookSale = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!locationId) {
      onShowNotification("Please select selling location.", "error");
      return;
    }

    if (!bookId || !selectedBook) {
      onShowNotification("Please select book.", "error");
      return;
    }

    if (!singleQuantity || Number(singleQuantity) <= 0) {
      onShowNotification("Please enter sale quantity.", "error");
      return;
    }

    if (Number(singleQuantity) > singleBookAvailableStock) {
      onShowNotification(
        `Insufficient stock. Only ${singleBookAvailableStock} unit(s) available at selected location.`,
        "error"
      );
      return;
    }

    if (salePrice === "" || Number(salePrice) < 0) {
      onShowNotification("Please enter valid sale price.", "error");
      return;
    }

    setLoading(true);

    try {
      await postSingleSaleToServer({
        targetBookId: bookId,
        targetQuantity: Number(singleQuantity),
        targetSalePrice: Number(salePrice),
        notes: "Single book sale",
      });

      onShowNotification("Single book sale recorded successfully.", "success");

      setSingleQuantity("");

      if (onClearPreSelectedBookId) {
        onClearPreSelectedBookId();
      }

      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message || "Failed to record sale.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSetSale = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!locationId) {
      onShowNotification("Please select selling location.", "error");
      return;
    }

    if (!gradeId || !selectedGrade) {
      onShowNotification("Please select grade.", "error");
      return;
    }

    if (gradeSetRows.length === 0) {
      onShowNotification("No books are linked with this grade.", "error");
      return;
    }

    if (selectedGradeSetRows.length === 0) {
      onShowNotification("Please keep at least one book selected.", "error");
      return;
    }

    if (!gradeSetQuantity || Number(gradeSetQuantity) <= 0) {
      onShowNotification("Please enter set quantity.", "error");
      return;
    }

    if (Number(gradeSetQuantity) > availableCompleteSets) {
      onShowNotification(
        `Only ${availableCompleteSets} complete set(s) available for ${selectedGrade.name}.`,
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      for (const row of selectedGradeSetRows) {
        await postSingleSaleToServer({
          targetBookId: row.book.id,
          targetQuantity: Number(gradeSetQuantity),
          targetSalePrice: row.salePrice,
          notes: `Grade set sale - ${selectedGrade.name}`,
        });
      }

      onShowNotification(`${selectedGrade.name} set sale recorded successfully.`, "success");

      setGradeSetQuantity("");
      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message || "Failed to record grade set sale.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (newGradeId: string) => {
    setGradeId(newGradeId);
    setBookId("");
    setSingleQuantity("");
    setGradeSetQuantity("");
    setSalePrice("");
    setSelectedGradeSetBookIds([]);
  };

  const removeGradeSetBook = (targetBookId: string) => {
    setSelectedGradeSetBookIds((currentIds) =>
      currentIds.filter((id) => id !== targetBookId)
    );
  };

  const restoreAllGradeSetBooks = () => {
    setSelectedGradeSetBookIds(gradeSetBooks.map((book) => book.id));
  };

  return (
    <div id="sales-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      <div className="border-b border-slate-200/60 pb-5">
        <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-rose-500" />
          <span>Sales / Stock Out</span>
        </h1>

        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
          Sell a single book or sell a complete grade set. Stock will be deducted from the selected location.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel border border-white/60 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setSaleType("single_book");
                setGradeSetQuantity("");
              }}
              className={`transform-gpu rounded-2xl border p-4 text-left transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:scale-[0.99] ${
                saleType === "single_book"
                  ? "border-rose-300 bg-rose-50 ring-2 ring-rose-100"
                  : "border-slate-200 bg-white hover:border-rose-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-slate-800">Single Book Sale</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Sell one book title only.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSaleType("grade_set");
                setSingleQuantity("");
                setBookId("");
                setSalePrice("");
              }}
              className={`transform-gpu rounded-2xl border p-4 text-left transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:scale-[0.99] ${
                saleType === "grade_set"
                  ? "border-rose-300 bg-rose-50 ring-2 ring-rose-100"
                  : "border-slate-200 bg-white hover:border-rose-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Layers className="w-5 h-5" />
                </div>

                <div>
                  <p className="text-sm font-extrabold text-slate-800">Grade Set Sale</p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Sell complete set of one grade.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {saleType === "single_book" ? (
            <form onSubmit={handleSingleBookSale} className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[11px] font-semibold text-blue-700">
                Single book sale will deduct stock only from the selected book and selected location.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Sale Date" icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </FormField>

                <FormField label="Selling Location" icon={<Building2 className="w-3.5 h-3.5 text-slate-400" />}>
                  <select
                    required
                    value={locationId}
                    onChange={(event) => setLocationId(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Location
                    </option>

                    {activeLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Grade Filter" icon={<Layers className="w-3.5 h-3.5 text-slate-400" />}>
                  <select
                    value={gradeId}
                    onChange={(event) => handleGradeChange(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="">All Grades</option>

                    {activeGrades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Book" icon={<BookOpen className="w-3.5 h-3.5 text-slate-400" />}>
                  <select
                    required
                    value={bookId}
                    onChange={(event) => setBookId(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="">Select Book</option>

                    {booksForSingleSale.map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} ({book.book_number})
                      </option>
                    ))}
                  </select>
                </FormField>

                {selectedBook && (
                  <div className="sm:col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        Available Stock at Selected Location
                      </p>

                      <p
                        className={`mt-1 text-sm font-mono font-extrabold ${
                          singleBookAvailableStock > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {singleBookAvailableStock} Unit(s)
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        Book Sale Price
                      </p>

                      <p className="mt-1 text-sm font-mono font-extrabold text-slate-800">
                        PKR {selectedBook.sale_price}
                      </p>
                    </div>
                  </div>
                )}

                <FormField label="Sale Quantity" icon={<Calculator className="w-3.5 h-3.5 text-slate-400" />}>
                  <input
                    type="number"
                    min={1}
                    required
                    disabled={!bookId || singleBookAvailableStock === 0}
                    placeholder={
                      bookId ? `Max available: ${singleBookAvailableStock}` : "Enter quantity"
                    }
                    value={singleQuantity}
                    onChange={(event) =>
                      setSingleQuantity(event.target.value === "" ? "" : Number(event.target.value))
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none disabled:opacity-50"
                  />
                </FormField>

                <FormField label="Sale Price (PKR)" icon={<ShoppingCart className="w-3.5 h-3.5 text-slate-400" />}>
                  <input
                    type="number"
                    min={0}
                    required
                    value={salePrice}
                    onChange={(event) =>
                      setSalePrice(event.target.value === "" ? "" : Number(event.target.value))
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </FormField>
              </div>

              <SaleFooter
                label="Total Sale Amount"
                total={singleBookTotal}
                loading={loading}
                disabled={
                  loading ||
                  !bookId ||
                  !singleQuantity ||
                  singleBookAvailableStock === 0 ||
                  Number(singleQuantity) > singleBookAvailableStock
                }
                buttonText="Record Single Book Sale"
              />
            </form>
          ) : (
            <form onSubmit={handleGradeSetSale} className="space-y-4">
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-[11px] font-semibold text-rose-700">
                Grade set sale will deduct same quantity from every active book linked with the selected grade.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Sale Date" icon={<Calendar className="w-3.5 h-3.5 text-slate-400" />}>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </FormField>

                <FormField label="Selling Location" icon={<Building2 className="w-3.5 h-3.5 text-slate-400" />}>
                  <select
                    required
                    value={locationId}
                    onChange={(event) => setLocationId(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Location
                    </option>

                    {activeLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Grade / Class" icon={<Layers className="w-3.5 h-3.5 text-slate-400" />}>
                  <select
                    required
                    value={gradeId}
                    onChange={(event) => handleGradeChange(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="">Select Grade</option>

                    {activeGrades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Set Quantity" icon={<Calculator className="w-3.5 h-3.5 text-slate-400" />}>
                  <input
                    type="number"
                    min={1}
                    required
                    disabled={!gradeId || availableCompleteSets === 0}
                    placeholder={
                      gradeId ? `Max sets: ${availableCompleteSets}` : "Enter set quantity"
                    }
                    value={gradeSetQuantity}
                    onChange={(event) =>
                      setGradeSetQuantity(event.target.value === "" ? "" : Number(event.target.value))
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none disabled:opacity-50"
                  />
                </FormField>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/5 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">
                      {selectedGrade ? `${selectedGrade.name} Set Books` : "Grade Set Books"}
                    </p>

                    <p className="mt-1 text-[11px] font-semibold opacity-70">
                      All books are selected automatically. Use the cross button to remove unwanted books.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-center">
                      <p className="text-[9px] uppercase font-extrabold opacity-70">Selected Books</p>
                      <p className="text-lg font-mono font-extrabold">{selectedGradeSetRows.length}/{gradeSetRows.length}</p>
                    </div>
                    <div className="rounded-2xl border border-blue-300/20 bg-blue-500/10 px-4 py-2 text-center">
                      <p className="text-[9px] uppercase font-extrabold text-blue-400">Available Sets</p>
                      <p className="text-lg font-mono font-extrabold text-blue-400">{availableCompleteSets}</p>
                    </div>
                    {gradeSetRows.length > 0 && selectedGradeSetRows.length < gradeSetRows.length && (
                      <button type="button" onClick={restoreAllGradeSetBooks} className="transform-gpu inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-extrabold shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg active:translate-y-0 active:scale-95">
                        <RotateCcw className="h-3.5 w-3.5" /> Restore All
                      </button>
                    )}
                  </div>
                </div>

                {gradeSetRows.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold opacity-60">Select a grade to see books in this set.</div>
                ) : selectedGradeSetRows.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-xs font-extrabold text-rose-500">All books have been removed from this sale.</p>
                    <button type="button" onClick={restoreAllGradeSetBooks} className="mt-3 transform-gpu inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-extrabold shadow-sm transition-all duration-200 hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg active:translate-y-0 active:scale-95">
                      <RotateCcw className="h-3.5 w-3.5" /> Restore All Books
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-mono text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Book</th>
                          <th className="px-4 py-3 text-right">Available</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-center">Remove</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {selectedGradeSetRows.map((row) => (
                          <tr key={row.book.id} className="transition-colors hover:bg-white/5">
                            <td className="px-4 py-3">
                              <p className="font-extrabold text-slate-800">{row.book.title}</p>
                              <p className="text-[10px] font-mono text-slate-400">
                                {row.book.book_number}
                              </p>
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-700">
                              {row.availableStock}
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-extrabold text-rose-500">
                              PKR {row.salePrice}
                            </td>

                            <td className="px-4 py-3">
                              {row.availableStock === availableCompleteSets ? (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                                  <AlertTriangle className="w-3 h-3" />
                                  Limiting
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                                  <CheckCircle className="w-3 h-3" />
                                  OK
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button type="button" onClick={() => removeGradeSetBook(row.book.id)} title={`Remove ${row.book.title} from this sale`} aria-label={`Remove ${row.book.title} from this sale`} className="transform-gpu inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-300/30 bg-rose-500/10 text-rose-500 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:bg-rose-500/20 hover:shadow-lg active:translate-y-0 active:scale-95">
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <SaleFooter
                label="Total Set Sale Amount"
                total={gradeSetTotal}
                loading={loading}
                disabled={
                  loading ||
                  !gradeId ||
                  selectedGradeSetRows.length === 0 ||
                  !gradeSetQuantity ||
                  availableCompleteSets === 0 ||
                  Number(gradeSetQuantity) > availableCompleteSets
                }
                buttonText="Record Grade Set Sale"
              />
            </form>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-3xl border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] rounded-2xl p-5 text-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-2.5">
              <Info className="w-4 h-4 text-rose-500" />
              <span>Simple Sales Logic</span>
            </h3>

            <ul className="list-disc list-inside text-[11px] text-slate-500 mt-2 space-y-1.5 pl-1 font-medium">
              <li>Single Book Sale deducts stock from one selected book.</li>
              <li>Grade Set Sale deducts stock from every book inside that grade.</li>
              <li>System blocks sale if selected location has insufficient stock.</li>
              <li>Stock List and Grade Sets update after saving sale.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-xs font-semibold text-blue-700">
            <p className="font-extrabold text-blue-900">Example:</p>
            <p className="mt-1">
              If Grade 9 has Urdu, English, and Physics books, selling 5 Grade 9 sets will deduct
              5 quantity from all three books.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </label>

      {children}
    </div>
  );
}

function SaleFooter({
  label,
  total,
  loading,
  disabled,
  buttonText,
}: {
  label: string;
  total: number;
  loading: boolean;
  disabled: boolean;
  buttonText: string;
}) {
  return (
    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
        <span className="text-slate-400 text-[10px] uppercase font-bold">
          {label}:
        </span>

        <span className="text-emerald-600 font-mono font-extrabold ml-1.5 text-sm">
          PKR {total.toLocaleString()}
        </span>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="btn-premium-pink transform-gpu inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:scale-100"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        ) : (
          <ShoppingCart className="w-4 h-4 text-white" />
        )}

        <span>{buttonText}</span>
      </button>
    </div>
  );
}