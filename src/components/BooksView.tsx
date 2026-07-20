import React, { useState } from "react";
import {
  Plus,
  Edit2,
  ShieldAlert,
  X,
  Search,
  BookOpen,
  Sparkles,
  Trash2,
} from "lucide-react";
import { DatabaseSchema, Book } from "../types";
import { apiFetch } from "../api/http";

interface BooksViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

export default function BooksView({
  data,
  onRefresh,
  onShowNotification,
}: BooksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [publisherId, setPublisherId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classId, setClassId] = useState("");
  const [purchaseCost, setPurchaseCost] = useState<number | "">("");
  const [salePrice, setSalePrice] = useState<number | "">("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const activePublishers = data.publishers.filter(
    (publisher) => publisher.status === "active"
  );

  const activeCategories = data.categories.filter(
    (category) => category.status === "active"
  );

  const activeSubjects = data.subjects.filter(
    (subject) => subject.status === "active"
  );

  const activeClasses = data.classes.filter(
    (grade) => grade.status === "active"
  );

  const handleOpenAdd = () => {
    setEditingBook(null);
    setTitle("");
    setPublisherId(activePublishers[0]?.id || "");
    setCategoryId(activeCategories[0]?.id || "");
    setSubjectId(activeSubjects[0]?.id || "");
    setClassId(activeClasses[0]?.id || "");
    setPurchaseCost("");
    setSalePrice("");
    setStatus("active");
    setLoading(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setEditingBook(book);
    setTitle(book.title);
    setPublisherId(book.publisher_id);
    setCategoryId(book.category_id);
    setSubjectId(book.subject_id);
    setClassId(book.class_id);
    setPurchaseCost(book.purchase_cost);
    setSalePrice(book.sale_price);
    setStatus(book.status);
    setLoading(false);
    setIsFormOpen(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this book title? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await apiFetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete book.");
      }

      onShowNotification("Book permanently deleted!", "success");
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    }
  };

  const toggleDeactivateBook = async (book: Book) => {
    const newStatus = book.status === "active" ? "inactive" : "active";

    try {
      const res = await apiFetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to change book status.");
      }

      onShowNotification(
        `Book is now ${newStatus === "active" ? "activated" : "deactivated"}!`,
        "success"
      );

      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    }
  };

  const handleSaveBook = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      onShowNotification("Please enter book title.", "error");
      return;
    }

    if (!publisherId) {
      onShowNotification("Please select publisher.", "error");
      return;
    }

    if (!categoryId) {
      onShowNotification("Please select category.", "error");
      return;
    }

    if (!subjectId) {
      onShowNotification("Please select subject.", "error");
      return;
    }

    if (!classId) {
      onShowNotification("Please select grade/class.", "error");
      return;
    }

    if (purchaseCost === "" || Number(purchaseCost) < 0) {
      onShowNotification("Please enter valid purchase cost.", "error");
      return;
    }

    if (salePrice === "" || Number(salePrice) < 0) {
      onShowNotification("Please enter valid sale price.", "error");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        publisher_id: publisherId,
        category_id: categoryId,
        subject_id: subjectId,
        class_id: classId,
        purchase_cost: Number(purchaseCost),
        sale_price: Number(salePrice),
        reorder_level: 0,
        status,
      };

      const url = editingBook ? `/api/books/${editingBook.id}` : "/api/books";
      const method = editingBook ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save book.");
      }

      onShowNotification(
        editingBook
          ? `Book "${title}" updated successfully!`
          : `Book "${title}" registered successfully!`,
        "success"
      );

      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      onShowNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = data.books.filter((book) => {
    const publisherName =
      data.publishers.find((publisher) => publisher.id === book.publisher_id)
        ?.publisher_name || "";

    const categoryName =
      data.categories.find((category) => category.id === book.category_id)?.name || "";

    const subjectName =
      data.subjects.find((subject) => subject.id === book.subject_id)?.name || "";

    const className =
      data.classes.find((grade) => grade.id === book.class_id)?.name || "";

    const query = searchQuery.toLowerCase();

    return (
      book.title.toLowerCase().includes(query) ||
      book.book_number.toLowerCase().includes(query) ||
      publisherName.toLowerCase().includes(query) ||
      categoryName.toLowerCase().includes(query) ||
      subjectName.toLowerCase().includes(query) ||
      className.toLowerCase().includes(query)
    );
  });

  return (
    <div id="books-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-500" />
            <span>Book Registry</span>
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Register book titles only. Stock will be added separately from the Add Stock page.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4.5 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer self-start shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Register New Book</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Search className="w-4 h-4" />
            </div>

            <input
              type="text"
              placeholder="Search by title, book code, publisher, subject, grade, or category..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full bg-transparent border-0 text-slate-700 font-bold text-xs focus:ring-0 focus:outline-none placeholder:text-slate-400"
            />

            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-extrabold text-slate-600 hover:bg-slate-100"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
          <span>Book Titles Count:</span>
          <span className="text-rose-600 font-extrabold font-mono">
            {filteredBooks.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredBooks.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 font-mono text-xs">
            No registered book titles found matching your search term.
          </div>
        ) : (
          filteredBooks.map((book) => {
            const publisherName =
              data.publishers.find((publisher) => publisher.id === book.publisher_id)
                ?.publisher_name || "N/A";

            const categoryName =
              data.categories.find((category) => category.id === book.category_id)?.name ||
              "N/A";

            const subjectName =
              data.subjects.find((subject) => subject.id === book.subject_id)?.name ||
              "N/A";

            const className =
              data.classes.find((grade) => grade.id === book.class_id)?.name || "N/A";

            const hasHistory =
              (data.stock_history || []).some((history) => history.book_id === book.id) ||
              (data.sale_items || []).some((sale) => sale.book_id === book.id) ||
              (data.customer_returns || []).some(
                (returnRow) => returnRow.book_id === book.id
              ) ||
              (data.publisher_returns || []).some(
                (returnRow) => returnRow.book_id === book.id
              ) ||
              (data.stock_transfers || []).some(
                (transfer) => transfer.book_id === book.id
              ) ||
              (data.damage_loss_records || []).some(
                (damage) => damage.book_id === book.id
              );

            return (
              <div
                key={book.id}
                className="glass-panel border border-white/60 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-rose-200 hover:shadow-md transition-all group"
              >
                <div className="h-28 bg-gradient-to-br from-rose-50 to-slate-50 p-4 relative flex items-end">
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-white rounded-lg border border-slate-200/80 text-[9px] font-bold font-mono text-rose-600 shadow-sm">
                    {book.book_number}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        book.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-rose-50 text-rose-600 border-rose-200"
                      }`}
                    >
                      {book.status}
                    </span>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <div className="w-10 h-14 bg-white rounded border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-5 h-5 text-slate-300" />
                    </div>

                    <div>
                      <h3
                        className="text-slate-800 text-xs font-bold leading-tight group-hover:text-rose-500 transition-colors line-clamp-2"
                        title={book.title}
                      >
                        {book.title}
                      </h3>

                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                        By {publisherName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2.5 text-[11px] text-slate-500 border-t border-slate-100 bg-white/40 flex-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 text-center">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">
                        Subject
                      </span>
                      <span className="text-slate-700 font-bold truncate block">
                        {subjectName}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 text-center">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">
                        Grade
                      </span>
                      <span className="text-slate-700 font-bold truncate block">
                        {className}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 text-center">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">
                        Category
                      </span>
                      <span className="text-slate-700 font-bold truncate block">
                        {categoryName}
                      </span>
                    </div>

                    <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 text-center">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">
                        Publisher
                      </span>
                      <span className="text-slate-700 font-bold truncate block">
                        {publisherName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">
                        Purchase Cost
                      </span>
                      <span className="font-mono font-bold text-slate-600">
                        PKR {book.purchase_cost}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">
                        Sale Price
                      </span>
                      <span className="font-mono font-extrabold text-rose-500">
                        PKR {book.sale_price}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[9px] text-slate-400 font-mono flex items-center justify-between font-bold">
                  <div>
                    <div>Code: {book.book_number}</div>
                    <div>Grade: {className}</div>
                  </div>

                  <div className="flex gap-1.5 items-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(book)}
                      className="p-1 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer transition-all shadow-xs"
                      title="Edit Book Details"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {hasHistory ? (
                      <button
                        type="button"
                        onClick={() => toggleDeactivateBook(book)}
                        className={`p-1 border rounded-lg cursor-pointer transition-all shadow-xs ${
                          book.status === "active"
                            ? "text-rose-500 hover:text-rose-600 bg-white hover:bg-rose-50 border-rose-100"
                            : "text-emerald-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 border-emerald-100"
                        }`}
                        title={
                          book.status === "active" ? "Deactivate Book" : "Activate Book"
                        }
                      >
                        <ShieldAlert className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(book.id)}
                        className="p-1 text-rose-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-rose-100 rounded-lg cursor-pointer transition-all shadow-xs"
                        title="Delete Book permanently"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.25)" }}
        >
          <div className="glass-panel border border-white/60 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl my-8 bg-white">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>
                    {editingBook
                      ? `Edit Book: ${editingBook.book_number}`
                      : "Register New Book"}
                  </span>
                </h2>

                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Register book details only. Stock will be added from Add Stock.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-5">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[11px] font-semibold text-blue-700">
                Register the book title here. Add quantity later from the Add Stock page.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Book Title *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Example: Physics Grade 15"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Publisher *
                  </label>

                  <select
                    required
                    value={publisherId}
                    onChange={(event) => setPublisherId(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Publisher
                    </option>

                    {activePublishers.map((publisher) => (
                      <option key={publisher.id} value={publisher.id}>
                        {publisher.publisher_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Category *
                  </label>

                  <select
                    required
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Category
                    </option>

                    {activeCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Subject *
                  </label>

                  <select
                    required
                    value={subjectId}
                    onChange={(event) => setSubjectId(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Subject
                    </option>

                    {activeSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Grade / Class *
                  </label>

                  <select
                    required
                    value={classId}
                    onChange={(event) => setClassId(event.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  >
                    <option value="" disabled>
                      Select Grade / Class
                    </option>

                    {activeClasses.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Purchase Cost (PKR) *
                  </label>

                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="Example: 350"
                    value={purchaseCost}
                    onChange={(event) =>
                      setPurchaseCost(
                        event.target.value === "" ? "" : Number(event.target.value)
                      )
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Sale Price (PKR) *
                  </label>

                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="Example: 450"
                    value={salePrice}
                    onChange={(event) =>
                      setSalePrice(
                        event.target.value === "" ? "" : Number(event.target.value)
                      )
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 btn-premium-pink text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  )}

                  <span>{editingBook ? "Save Book" : "Register Book"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}