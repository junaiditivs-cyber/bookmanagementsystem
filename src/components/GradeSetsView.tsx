import React, { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Search,
  BookOpen,
  Building2,
  AlertTriangle,
  CheckCircle,
  Package,
  Plus,
  X,
  Loader2,
  ArrowRight,
  PackagePlus,
} from "lucide-react";
import { DatabaseSchema } from "../types";
import { apiFetch } from "../api/http";

interface GradeSetsViewProps {
  data: DatabaseSchema;
  onRefresh: () => void | Promise<void>;
  onShowNotification: (message: string, type: "success" | "error") => void;
  onTriggerAddStock: (bookId: string) => void;
}

type GradeBookRow = {
  id: string;
  title: string;
  bookNumber: string;
  publisherName: string;
  subjectName: string;

  purchaseCost: number;
  salePrice: number;

  totalStock: number;

  locations: {
    locationName: string;
    quantity: number;
  }[];
};

type GradeCardRow = {
  gradeId: string;
  gradeName: string;
  books: GradeBookRow[];
  completeSets: number;
  totalUnits: number;
  limitingBookName: string;
  limitingBookStock: number;
};

type AddBookForm = {
  title: string;
  publisherId: string;
  categoryId: string;
  subjectId: string;
  purchaseCost: string;
  salePrice: string;
  reorderLevel: string;
  barcode: string;
  isbn: string;
  openingStockQty: string;
  openingStockLocationId: string;
  notes: string;
};

const EMPTY_BOOK_FORM: AddBookForm = {
  title: "",
  publisherId: "",
  categoryId: "",
  subjectId: "",
  purchaseCost: "",
  salePrice: "",
  reorderLevel: "20",
  barcode: "",
  isbn: "",
  openingStockQty: "",
  openingStockLocationId: "",
  notes: "",
};

const MODERN_INPUT =
  "h-12 w-full rounded-2xl border border-slate-200/80 bg-white/85 px-4 text-sm font-bold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-blue-400/40 dark:focus:border-blue-400";

const MODERN_TEXTAREA =
  "min-h-[100px] w-full resize-none rounded-2xl border border-slate-200/80 bg-white/85 px-4 py-3 text-sm font-bold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-blue-400/40 dark:focus:border-blue-400";

function getGradeNumber(name: string) {
  const match = name.match(/\d+/);
  return match ? Number(match[0]) : 999;
}

export default function GradeSetsView({
  data,
  onRefresh,
  onShowNotification,
  onTriggerAddStock,
}: GradeSetsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");

  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [newGradeName, setNewGradeName] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [pendingSelectGradeName, setPendingSelectGradeName] = useState("");

  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [addBookGradeId, setAddBookGradeId] = useState("");
  const [addBookGradeName, setAddBookGradeName] = useState("");
  const [bookForm, setBookForm] = useState<AddBookForm>(EMPTY_BOOK_FORM);
  const [savingBook, setSavingBook] = useState(false);

  useEffect(() => {
    if (!pendingSelectGradeName) return;

    const createdGrade = data.classes.find(
      (grade) => grade.name.toLowerCase() === pendingSelectGradeName.toLowerCase()
    );

    if (createdGrade) {
      setSelectedGradeId(createdGrade.id);
      setPendingSelectGradeName("");
    }
  }, [data.classes, pendingSelectGradeName]);

  const activePublishers = useMemo(
    () => data.publishers.filter((publisher) => publisher.status === "active"),
    [data.publishers]
  );

  const activeCategories = useMemo(
    () => data.categories.filter((category) => category.status === "active"),
    [data.categories]
  );

  const activeSubjects = useMemo(
    () => data.subjects.filter((subject) => subject.status === "active"),
    [data.subjects]
  );

  const activeLocations = useMemo(
    () => data.locations.filter((location) => location.status === "active"),
    [data.locations]
  );

  const publisherById = useMemo(
    () => new Map(data.publishers.map((publisher) => [publisher.id, publisher.publisher_name])),
    [data.publishers]
  );

  const subjectById = useMemo(
    () => new Map(data.subjects.map((subject) => [subject.id, subject.name])),
    [data.subjects]
  );

  const locationById = useMemo(
    () => new Map(data.locations.map((location) => [location.id, location.name])),
    [data.locations]
  );

  const stockByBookId = useMemo(() => {
    const map = new Map<string, number>();

    for (const balance of data.stock_balances || []) {
      map.set(balance.book_id, (map.get(balance.book_id) || 0) + Number(balance.quantity || 0));
    }

    return map;
  }, [data.stock_balances]);

  const locationsByBookId = useMemo(() => {
    const map = new Map<string, { locationName: string; quantity: number }[]>();

    for (const balance of data.stock_balances || []) {
      const currentRows = map.get(balance.book_id) || [];
      currentRows.push({
        locationName: locationById.get(balance.location_id) || "Unknown Location",
        quantity: Number(balance.quantity || 0),
      });
      map.set(balance.book_id, currentRows);
    }

    return map;
  }, [data.stock_balances, locationById]);

  const gradeRows = useMemo<GradeCardRow[]>(() => {
    return data.classes
      .filter((grade) => grade.status === "active")
      .map((grade) => {
        const books = data.books
          .filter((book) => book.status === "active" && book.class_id === grade.id)
          .map((book) => ({
    id: book.id,
    title: book.title,
    bookNumber: book.book_number,

    publisherName: publisherById.get(book.publisher_id) || "N/A",
    subjectName: subjectById.get(book.subject_id) || "N/A",

    purchaseCost: Number(book.purchase_cost || 0),
    salePrice: Number(book.sale_price || 0),

    totalStock: stockByBookId.get(book.id) || 0,

    locations: locationsByBookId.get(book.id) || [],
}))
          .sort((a, b) => a.title.localeCompare(b.title));

        const completeSets = books.length > 0 ? Math.min(...books.map((book) => book.totalStock)) : 0;
        const totalUnits = books.reduce((sum, book) => sum + book.totalStock, 0);
        const limitingBook = books.length > 0
          ? [...books].sort((a, b) => a.totalStock - b.totalStock)[0]
          : null;

        return {
          gradeId: grade.id,
          gradeName: grade.name,
          books,
          completeSets,
          totalUnits,
          limitingBookName: limitingBook ? limitingBook.title : "No books added",
          limitingBookStock: limitingBook ? limitingBook.totalStock : 0,
        };
      })
      .sort((a, b) => getGradeNumber(a.gradeName) - getGradeNumber(b.gradeName));
  }, [data.books, data.classes, locationsByBookId, publisherById, stockByBookId, subjectById]);

  const filteredGradeRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return gradeRows;

    return gradeRows.filter(
      (row) =>
        row.gradeName.toLowerCase().includes(query) ||
        row.books.some(
          (book) =>
            book.title.toLowerCase().includes(query) ||
            book.publisherName.toLowerCase().includes(query) ||
            book.subjectName.toLowerCase().includes(query)
        )
    );
  }, [gradeRows, searchQuery]);

  const selectedGrade = useMemo(() => {
    if (selectedGradeId) {
      return gradeRows.find((row) => row.gradeId === selectedGradeId) || filteredGradeRows[0] || null;
    }
    return filteredGradeRows[0] || null;
  }, [filteredGradeRows, gradeRows, selectedGradeId]);

  const totalCompleteSets = gradeRows.reduce((sum, row) => sum + row.completeSets, 0);
  const totalGradeCards = gradeRows.length;
  const totalGradeBooks = gradeRows.reduce((sum, row) => sum + row.books.length, 0);

  const openAddGradeModal = () => {
    setNewGradeName("");
    setShowAddGradeModal(true);
  };

  const closeAddGradeModal = () => {
    if (savingGrade) return;
    setNewGradeName("");
    setShowAddGradeModal(false);
  };

  const handleAddGrade = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanGradeName = newGradeName.trim();

    if (!cleanGradeName) {
      onShowNotification("Please enter grade name.", "error");
      return;
    }

    if (data.classes.some((grade) => grade.name.toLowerCase() === cleanGradeName.toLowerCase())) {
      onShowNotification("This grade already exists.", "error");
      return;
    }

    setSavingGrade(true);

    try {
      const response = await apiFetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanGradeName, status: "active" }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Failed to add grade.");

      setPendingSelectGradeName(cleanGradeName);
      setNewGradeName("");
      setShowAddGradeModal(false);
      await onRefresh();
      onShowNotification(`${cleanGradeName} added successfully.`, "success");
    } catch (error) {
      console.error(error);
      onShowNotification(error instanceof Error ? error.message : "Failed to add grade.", "error");
    } finally {
      setSavingGrade(false);
    }
  };

  const openAddBookModal = (gradeId: string, gradeName: string) => {
    const defaultLocation = activeLocations.find((location) => location.type === "warehouse") || activeLocations[0];

    setAddBookGradeId(gradeId);
    setAddBookGradeName(gradeName);
    setBookForm({
      ...EMPTY_BOOK_FORM,
      publisherId: activePublishers[0]?.id || "",
      categoryId: activeCategories[0]?.id || "",
      subjectId: activeSubjects[0]?.id || "",
      openingStockLocationId: defaultLocation?.id || "",
    });
    setShowAddBookModal(true);
  };

  const closeAddBookModal = (force = false) => {
    if (savingBook && !force) return;
    setShowAddBookModal(false);
    setAddBookGradeId("");
    setAddBookGradeName("");
    setBookForm(EMPTY_BOOK_FORM);
  };

  const updateBookForm = (field: keyof AddBookForm, value: string) => {
    setBookForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddBook = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!addBookGradeId) {
      onShowNotification("Grade is missing. Please reopen the Add Book form.", "error");
      return;
    }

    if (!bookForm.title.trim()) {
      onShowNotification("Please enter book title.", "error");
      return;
    }

    if (!bookForm.publisherId || !bookForm.categoryId || !bookForm.subjectId) {
      onShowNotification("Publisher, category, and subject are required.", "error");
      return;
    }

    const openingQty = Number(bookForm.openingStockQty || 0);
    if (openingQty > 0 && !bookForm.openingStockLocationId) {
      onShowNotification("Please select opening stock location.", "error");
      return;
    }

    setSavingBook(true);

    try {
      const response = await apiFetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookForm.title.trim(),
          publisher_id: bookForm.publisherId,
          category_id: bookForm.categoryId,
          subject_id: bookForm.subjectId,
          class_id: addBookGradeId,
          purchase_cost: Number(bookForm.purchaseCost || 0),
          sale_price: Number(bookForm.salePrice || 0),
          reorder_level: Number(bookForm.reorderLevel || 20),
          barcode: bookForm.barcode.trim() || undefined,
          ISBN: bookForm.isbn.trim() || undefined,
          notes: bookForm.notes.trim() || undefined,
          status: "active",
          opening_stock_qty: openingQty > 0 ? openingQty : undefined,
          opening_stock_location_id: openingQty > 0 ? bookForm.openingStockLocationId : undefined,
          opening_stock_notes: openingQty > 0
            ? `Opening stock added from ${addBookGradeName} grade card`
            : undefined,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Failed to add book.");

      closeAddBookModal(true);
      setSelectedGradeId(addBookGradeId);
      await onRefresh();
      onShowNotification(`${bookForm.title.trim()} added to ${addBookGradeName}.`, "success");
    } catch (error) {
      console.error(error);
      onShowNotification(error instanceof Error ? error.message : "Failed to add book.", "error");
    } finally {
      setSavingBook(false);
    }
  };

  const handleViewAll = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    requestAnimationFrame(() => {
      document.getElementById("selected-grade-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div id="grade-sets-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800 dark:text-slate-100">
      <div className="border-b border-slate-200/60 pb-5 dark:border-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-display font-extrabold text-slate-900 dark:text-white sm:text-2xl">
              <Layers className="h-5 w-5 text-rose-500" />
              Grade Wise Book Library
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
              Add and manage books directly inside each grade card.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddGradeModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Add Grade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard title="Grade Cards" value={totalGradeCards} helper="Active grade groups" />
        <SummaryCard title="Complete Sets" value={totalCompleteSets} helper="Sets available across grades" />
        <SummaryCard title="Book Titles" value={totalGradeBooks} helper="Books linked with grades" />
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search grade, book, publisher, or subject..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 w-full border-0 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white"
          />
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredGradeRows.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
          <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-4 text-sm font-extrabold">No grades found</h3>
          <button
            type="button"
            onClick={openAddGradeModal}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-xs font-extrabold text-white"
          >
            <Plus className="h-4 w-4" />
            Add First Grade
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGradeRows.map((row) => {
            const isSelected = selectedGrade?.gradeId === row.gradeId;
            const previewBooks = row.books.slice(0, 3);
            const remainingBooks = Math.max(row.books.length - previewBooks.length, 0);

            return (
              <article
                key={row.gradeId}
                className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all dark:bg-white/[0.04] ${
                  isSelected
                    ? "border-rose-300 ring-4 ring-rose-100 dark:border-rose-400/50 dark:ring-rose-500/10"
                    : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-white/10"
                }`}
              >
                <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-white/10 dark:from-white/[0.05] dark:to-transparent">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-display font-extrabold uppercase tracking-tight text-slate-900 dark:text-white">
                        {row.gradeName}
                      </p>
                      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-600">
                        Active
                      </p>
                    </div>
                    <span className="rounded-2xl border border-blue-100 bg-blue-50 p-2.5 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
                      <BookOpen className="h-5 w-5" />
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Book Titles</p>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-blue-600 dark:text-blue-300">
                        {row.books.length.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                      <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Total Units</p>
                      <p className="mt-1 font-mono text-2xl font-extrabold text-slate-800 dark:text-white">
                        {row.totalUnits.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Books</p>
                    <p className="text-[10px] font-bold text-slate-400">Sets: {row.completeSets}</p>
                  </div>

                  {previewBooks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center dark:border-white/10 dark:bg-white/[0.03]">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No books added yet</p>
                      <p className="mt-1 text-[10px] text-slate-400">Add the first book directly to this grade.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                     {previewBooks.map((book) => (
  <div
    key={book.id}
    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
  >
    <div className="min-w-0">
      <p className="truncate text-xs font-extrabold text-slate-800 dark:text-slate-100">
        {book.title}
      </p>

      <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-400">
        {book.subjectName}
      </p>
    </div>

    <div className="shrink-0 text-right">
      <div className="rounded-lg bg-white px-2 py-1 font-mono text-[11px] font-extrabold text-blue-600 shadow-sm dark:bg-white/10 dark:text-blue-300">
        Stock: {book.totalStock.toLocaleString()}
      </div>

      <p className="mt-1 font-mono text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300">
        PKR {book.salePrice.toLocaleString()}
      </p>
    </div>
  </div>
))}
                      {remainingBooks > 0 && (
                        <button
                          type="button"
                          onClick={() => handleViewAll(row.gradeId)}
                          className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-[10px] font-extrabold text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:hover:bg-blue-500/10"
                        >
                          +{remainingBooks} more book{remainingBooks === 1 ? "" : "s"}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => openAddBookModal(row.gradeId, row.gradeName)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl"
                    >
                      <Plus className="h-4 w-4" />
                      Add Book
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewAll(row.gradeId)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200"
                    >
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedGrade && (
        <div
          id="selected-grade-detail"
          className="scroll-mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div className="border-b border-slate-100 p-5 dark:border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-display font-extrabold text-slate-900 dark:text-white">
                  <BookOpen className="h-5 w-5 text-rose-500" />
                  {selectedGrade.gradeName} Books
                </h2>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  All books registered under this grade.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAddBookModal(selectedGrade.gradeId, selectedGrade.gradeName)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-extrabold text-white"
              >
                <Plus className="h-4 w-4" />
                Add Book to {selectedGrade.gradeName}
              </button>
            </div>
          </div>

          {selectedGrade.books.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-xs font-bold text-slate-500">No books are linked with this grade yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-mono uppercase text-slate-400 dark:border-white/10 dark:bg-white/[0.03]">
                  <tr>
  <th className="px-5 py-3">Book</th>
  <th className="px-5 py-3">Subject</th>
  <th className="px-5 py-3">Publisher</th>
  <th className="px-5 py-3 text-right">Sale Price</th>
  <th className="px-5 py-3 text-right">Stock</th>
  <th className="px-5 py-3">Locations</th>
  <th className="px-5 py-3 text-right">Action</th>
</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {selectedGrade.books.map((book) => (
                    <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-800 dark:text-slate-100">{book.title}</p>
                        <p className="mt-0.5 text-[10px] font-mono text-slate-400">{book.bookNumber}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-300">{book.subjectName}</td>
                      <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-300">
  {book.publisherName}
</td>

<td className="px-5 py-4 text-right">
  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-300">
    PKR {book.salePrice.toLocaleString()}
  </span>
</td>

<td className="px-5 py-4 text-right font-mono font-extrabold text-blue-600 dark:text-blue-300">
  {book.totalStock.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        {book.locations.length === 0 ? (
                          <span className="text-[10px] font-bold text-slate-400">No stock location</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {book.locations.map((location, index) => (
                              <span
                                key={`${book.id}-${location.locationName}-${index}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                              >
                                <Building2 className="h-3 w-3" />
                                {location.locationName}: {location.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onTriggerAddStock(book.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-extrabold text-blue-700 hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300"
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                          Add Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50 p-4 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400">
            <Package className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Complete sets are calculated from the lowest-stock book in this grade.</p>
          </div>
        </div>
      )}

      {showAddGradeModal && (
        <ModalShell onClose={closeAddGradeModal} disabled={savingGrade} maxWidth="max-w-md">
          <ModalHeader
            title="Add New Grade"
            description="Create a new grade card for your grade-wise book library."
            onClose={closeAddGradeModal}
            disabled={savingGrade}
          />
          <form onSubmit={handleAddGrade} className="mt-5 space-y-4">
            <FormField label="Grade Name">
              <input
                type="text"
                value={newGradeName}
                onChange={(event) => setNewGradeName(event.target.value)}
                placeholder="Example: Grade 5"
                className="premium-form-input border-white/55 bg-white/50 shadow-sm backdrop-blur-xl focus:border-blue-400 focus:bg-white/75 dark:border-white/10 dark:bg-white/[0.055] dark:focus:border-blue-400/60 dark:focus:bg-white/[0.08]"
                autoFocus
              />
            </FormField>
            <ModalActions
              saving={savingGrade}
              savingText="Saving..."
              submitText="Save Grade"
              onCancel={closeAddGradeModal}
            />
          </form>
        </ModalShell>
      )}

      {showAddBookModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-4 backdrop-blur-md sm:px-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingBook) closeAddBookModal();
          }}
        >
          <div className="relative flex max-h-[94vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[30px] border border-white/40 bg-white/82 shadow-[0_35px_120px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1220]/92">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-200/70 bg-white/55 px-5 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:px-7">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-[0_12px_30px_rgba(79,70,229,0.28)]">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
                    Grade Book Library
                  </p>
                  <h3 className="mt-1 truncate text-xl font-display font-extrabold tracking-tight text-slate-950 dark:text-white">
                    Add Book to {addBookGradeName}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Register a new title directly inside this grade.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => closeAddBookModal()}
                disabled={savingBook}
                aria-label="Close add book form"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:scale-105 hover:bg-white hover:text-slate-900 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddBook} className="relative z-10 flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 premium-scroll sm:px-7">
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-3xl border border-blue-200/70 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-violet-50/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-blue-400/20 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-violet-500/10">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-blue-500">
                        Selected Grade
                      </p>
                      <p className="mt-1 text-lg font-display font-extrabold text-slate-950 dark:text-white">
                        {addBookGradeName}
                      </p>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Active Grade
                    </div>
                  </div>

                  <section className="rounded-3xl border border-slate-200/80 bg-white/78 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Book Details</h4>
                        <p className="text-[10px] font-semibold text-slate-400">
                          Main information used across inventory and sales.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <FormField label="Book Title *">
                          <input
                            type="text"
                            value={bookForm.title}
                            onChange={(event) => updateBookForm("title", event.target.value)}
                            placeholder="Enter complete book title"
                            className={MODERN_INPUT}
                            autoFocus
                          />
                        </FormField>
                      </div>

                      <FormField label="Publisher *">
                        <select
                          value={bookForm.publisherId}
                          onChange={(event) => updateBookForm("publisherId", event.target.value)}
                          className={MODERN_INPUT}
                        >
                          <option value="">Select Publisher</option>
                          {activePublishers.map((publisher) => (
                            <option key={publisher.id} value={publisher.id}>
                              {publisher.publisher_name}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Subject *">
                        <select
                          value={bookForm.subjectId}
                          onChange={(event) => updateBookForm("subjectId", event.target.value)}
                          className={MODERN_INPUT}
                        >
                          <option value="">Select Subject</option>
                          {activeSubjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Category *">
                        <select
                          value={bookForm.categoryId}
                          onChange={(event) => updateBookForm("categoryId", event.target.value)}
                          className={MODERN_INPUT}
                        >
                          <option value="">Select Category</option>
                          {activeCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Reorder Level">
                        <input
                          type="number"
                          min={0}
                          value={bookForm.reorderLevel}
                          onChange={(event) => updateBookForm("reorderLevel", event.target.value)}
                          className={MODERN_INPUT}
                          placeholder="20"
                        />
                      </FormField>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200/80 bg-white/78 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Pricing & Identification</h4>
                        <p className="text-[10px] font-semibold text-slate-400">
                          Cost, selling price, barcode, and ISBN.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Purchase Cost (PKR)">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={bookForm.purchaseCost}
                          onChange={(event) => updateBookForm("purchaseCost", event.target.value)}
                          className={MODERN_INPUT}
                          placeholder="0"
                        />
                      </FormField>

                      <FormField label="Sale Price (PKR)">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={bookForm.salePrice}
                          onChange={(event) => updateBookForm("salePrice", event.target.value)}
                          className={MODERN_INPUT}
                          placeholder="0"
                        />
                      </FormField>

                      <FormField label="Barcode">
                        <input
                          type="text"
                          value={bookForm.barcode}
                          onChange={(event) => updateBookForm("barcode", event.target.value)}
                          className={MODERN_INPUT}
                          placeholder="Optional barcode"
                        />
                      </FormField>

                      <FormField label="ISBN">
                        <input
                          type="text"
                          value={bookForm.isbn}
                          onChange={(event) => updateBookForm("isbn", event.target.value)}
                          className={MODERN_INPUT}
                          placeholder="Optional ISBN"
                        />
                      </FormField>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-emerald-200/70 bg-emerald-50/55 p-4 shadow-sm dark:border-emerald-400/20 dark:bg-emerald-500/[0.06] sm:p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <PackagePlus className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Opening Stock</h4>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          Optional. Leave quantity empty to register the title only.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField label="Opening Quantity">
                        <input
                          type="number"
                          min={0}
                          value={bookForm.openingStockQty}
                          onChange={(event) => updateBookForm("openingStockQty", event.target.value)}
                          className={MODERN_INPUT}
                          placeholder="0"
                        />
                      </FormField>

                      <FormField label="Stock Location">
                        <select
                          value={bookForm.openingStockLocationId}
                          onChange={(event) => updateBookForm("openingStockLocationId", event.target.value)}
                          className={MODERN_INPUT}
                        >
                          <option value="">Select Location</option>
                          {activeLocations.map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name} ({location.type})
                            </option>
                          ))}
                        </select>
                      </FormField>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200/80 bg-white/78 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] sm:p-5">
                    <FormField label="Notes">
                      <textarea
                        rows={3}
                        value={bookForm.notes}
                        onChange={(event) => updateBookForm("notes", event.target.value)}
                        className={MODERN_TEXTAREA}
                        placeholder="Edition, printing, supplier, condition, or any other note..."
                      />
                    </FormField>
                  </section>

                  {(activePublishers.length === 0 ||
                    activeCategories.length === 0 ||
                    activeSubjects.length === 0) && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                      Add at least one active publisher, category, and subject before saving a book.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200/70 bg-white/78 px-5 py-4 backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1220]/88 sm:px-7">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[10px] font-semibold text-slate-400">
                    Required fields are marked with an asterisk.
                  </p>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => closeAddBookModal()}
                      disabled={savingBook}
                      className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        savingBook ||
                        activePublishers.length === 0 ||
                        activeCategories.length === 0 ||
                        activeSubjects.length === 0
                      }
                      className="inline-flex h-11 min-w-[145px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 text-xs font-extrabold text-white shadow-[0_14px_35px_rgba(79,70,229,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(79,70,229,0.4)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                    >
                      {savingBook ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving Book...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Save Book
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, helper }: { title: string; value: number; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{title}</p>
      <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{value.toLocaleString()}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

function ModalShell({
  children,
  onClose,
  disabled,
  maxWidth,
}: {
  children: React.ReactNode;
  onClose: () => void;
  disabled: boolean;
  maxWidth: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !disabled) onClose();
      }}
    >
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-[2rem] border border-white/45 bg-white/72 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/72 ${maxWidth}`}
      >
        <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-white/55 via-white/20 to-blue-100/20 dark:from-white/[0.08] dark:via-transparent dark:to-blue-500/[0.06]" />
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
  disabled,
}: {
  title: string;
  description: string;
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="rounded-xl border border-white/55 bg-white/45 p-2 text-slate-500 shadow-sm backdrop-blur-xl transition hover:bg-white/75 hover:text-slate-800 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ModalActions({
  saving,
  savingText,
  submitText,
  onCancel,
  disabled = false,
}: {
  saving: boolean;
  savingText: string;
  submitText: string;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-2xl border border-white/55 bg-white/45 px-5 py-3 text-xs font-extrabold text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-white/80 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving || disabled}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {savingText}
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            {submitText}
          </>
        )}
      </button>
    </div>
  );
}