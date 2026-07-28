import React, { useState } from "react";
import {
  BadgeDollarSign,
  BookOpen,
  Edit2,
  GraduationCap,
  Library,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Tags,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { DatabaseSchema, Book } from "../types";
import { apiFetch } from "../api/http";
import ScreenModalPortal from "./ui/ScreenModalPortal";

interface BooksViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

const INPUT_CLASS =
  "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10 dark:[color-scheme:dark]";

const PANEL_CLASS =
  "rounded-[2rem] border border-slate-200/90 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-amber-300/15 dark:bg-[#10263c]/95 dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)]";

const SOFT_PANEL_CLASS =
  "rounded-2xl border border-slate-200 bg-slate-50/90 dark:border-white/10 dark:bg-white/[0.04]";

const LABEL_CLASS =
  "mb-2 block text-xs font-extrabold text-slate-800 dark:text-slate-200";

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
    (publisher) => publisher.status === "active",
  );

  const activeCategories = data.categories.filter(
    (category) => category.status === "active",
  );

  const activeSubjects = data.subjects.filter(
    (subject) => subject.status === "active",
  );

  const activeClasses = data.classes.filter(
    (grade) => grade.status === "active",
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
        "Are you sure you want to permanently delete this book title? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete book.");
      }

      onShowNotification("Book permanently deleted!", "success");
      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message, "error");
    }
  };

  const toggleDeactivateBook = async (book: Book) => {
    const newStatus = book.status === "active" ? "inactive" : "active";

    try {
      const response = await apiFetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to change book status.");
      }

      onShowNotification(
        `Book is now ${
          newStatus === "active" ? "activated" : "deactivated"
        }!`,
        "success",
      );

      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message, "error");
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
        reorder_level: editingBook
          ? Number(editingBook.reorder_level || 0)
          : 0,
        status,
      };

      const url = editingBook
        ? `/api/books/${editingBook.id}`
        : "/api/books";

      const method = editingBook ? "PUT" : "POST";

      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save book.");
      }

      onShowNotification(
        editingBook
          ? `Book "${title}" updated successfully!`
          : `Book "${title}" registered successfully!`,
        "success",
      );

      setIsFormOpen(false);
      onRefresh();
    } catch (error: any) {
      onShowNotification(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = data.books.filter((book) => {
    const publisherName =
      data.publishers.find(
        (publisher) => publisher.id === book.publisher_id,
      )?.publisher_name || "";

    const categoryName =
      data.categories.find(
        (category) => category.id === book.category_id,
      )?.name || "";

    const subjectName =
      data.subjects.find((subject) => subject.id === book.subject_id)
        ?.name || "";

    const className =
      data.classes.find((grade) => grade.id === book.class_id)?.name ||
      "";

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
    <div
      id="books-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#10263c] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.11),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_34%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                grid h-14 w-14 shrink-0 place-items-center rounded-2xl
                border border-amber-300 bg-amber-50 text-amber-800
                shadow-[0_12px_28px_rgba(180,123,24,0.15)]
                dark:border-amber-300/25 dark:bg-amber-300/10
                dark:text-amber-300
              "
            >
              <Library className="h-7 w-7" />
            </div>

            <div>
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300 bg-amber-50 px-3 py-1
                  text-[9px] font-black uppercase tracking-[0.22em]
                  text-amber-800
                  dark:border-amber-300/25 dark:bg-amber-300/10
                  dark:text-amber-200
                "
              >
                <Sparkles className="h-3.5 w-3.5" />
                Master book catalog
              </div>

              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Book Registry
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Register and maintain book titles. Physical quantity is
                received separately through the Add Stock page.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="
              inline-flex items-center justify-center gap-2 self-start
              rounded-2xl border border-amber-400
              bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
              px-5 py-3 text-sm font-extrabold text-slate-950
              shadow-[0_14px_32px_rgba(180,123,24,0.24)]
              transition hover:-translate-y-0.5 hover:brightness-105
              dark:border-amber-300/40 dark:text-[#081827]
              lg:self-center
            "
          >
            <Plus className="h-4 w-4" />
            <span>Register New Book</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Book Titles</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{data.books.length.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">All registered titles</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Active Titles</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
            {data.books.filter((book) => book.status === "active").length.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Available for daily operations</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Publishers</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{activePublishers.length.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active publishing partners</p>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <Search className="h-5 w-5" />
          </div>

          <input
            type="text"
            placeholder="Search by title, code, publisher, subject, grade, or category..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 w-full border-0 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0 dark:text-white"
          />

          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredBooks.length === 0 ? (
          <div
            className="
              col-span-full rounded-[2rem] border border-dashed
              border-slate-300 bg-white/90 py-16 text-center
              shadow-sm dark:border-white/15 dark:bg-white/[0.04]
            "
          >
            <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-sm font-extrabold text-slate-700 dark:text-slate-300">
              No registered book titles found.
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Try a different search term or register a new book.
            </p>
          </div>
        ) : (
          filteredBooks.map((book) => {
            const publisherName =
              data.publishers.find(
                (publisher) => publisher.id === book.publisher_id,
              )?.publisher_name || "N/A";

            const categoryName =
              data.categories.find(
                (category) => category.id === book.category_id,
              )?.name || "N/A";

            const subjectName =
              data.subjects.find(
                (subject) => subject.id === book.subject_id,
              )?.name || "N/A";

            const className =
              data.classes.find((grade) => grade.id === book.class_id)
                ?.name || "N/A";

            const hasHistory =
              (data.stock_history || []).some(
                (history) => history.book_id === book.id,
              ) ||
              (data.sale_items || []).some(
                (sale) => sale.book_id === book.id,
              ) ||
              (data.customer_returns || []).some(
                (returnRow) => returnRow.book_id === book.id,
              ) ||
              (data.publisher_returns || []).some(
                (returnRow) => returnRow.book_id === book.id,
              ) ||
              (data.stock_transfers || []).some(
                (transfer) => transfer.book_id === book.id,
              ) ||
              (data.damage_loss_records || []).some(
                (damage) => damage.book_id === book.id,
              );

            return (
              <article
                key={book.id}
                className="
                  group flex min-h-[390px] flex-col overflow-hidden
                  rounded-3xl border border-slate-200
                  bg-white shadow-sm transition-all
                  hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg
                  dark:border-white/10 dark:bg-[#10263c]
                "
              >
                <div
                  className="
                    relative flex min-h-[145px] items-end overflow-hidden
                    border-b border-slate-200
                    bg-[linear-gradient(135deg,#fff9e9_0%,#ffffff_55%,#edf4ff_100%)]
                    p-5
                    dark:border-white/10
                    dark:bg-[linear-gradient(135deg,#0b1c2f_0%,#102840_100%)]
                  "
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border border-amber-300/20" />

                  <div
                    className="
                      absolute left-4 top-4 rounded-xl border
                      border-amber-300 bg-white px-2.5 py-1
                      font-mono text-[10px] font-extrabold
                      text-amber-800 shadow-sm
                      dark:border-amber-300/25
                      dark:bg-amber-300/10 dark:text-amber-200
                    "
                  >
                    {book.book_number}
                  </div>

                  <span
                    className={`absolute right-4 top-4 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                      book.status === "active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                    }`}
                  >
                    {book.status}
                  </span>

                  <div className="relative flex min-w-0 items-center gap-4">
                    <div
                      className="
                        grid h-16 w-12 shrink-0 place-items-center
                        rounded-xl border border-amber-200 bg-white
                        text-amber-700 shadow-md transition
                        group-hover:-rotate-1 group-hover:scale-105
                        dark:border-amber-300/20 dark:bg-white/[0.06]
                        dark:text-amber-300
                      "
                    >
                      <BookOpen className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <h3
                        className="
                          line-clamp-2 text-base font-extrabold leading-snug
                          text-slate-950 transition
                          group-hover:text-amber-800
                          dark:text-[#f7ddb0]
                          dark:group-hover:text-amber-200
                        "
                        title={book.title}
                      >
                        {book.title}
                      </h3>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-600 dark:text-slate-400">
                        By {publisherName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <BookMeta
                      icon={Tags}
                      label="Subject"
                      value={subjectName}
                    />

                    <BookMeta
                      icon={GraduationCap}
                      label="Grade"
                      value={className}
                    />

                    <BookMeta
                      icon={Library}
                      label="Category"
                      value={categoryName}
                    />

                    <BookMeta
                      icon={UserRound}
                      label="Publisher"
                      value={publisherName}
                    />
                  </div>

                  <div
                    className="
                      grid grid-cols-2 gap-3 rounded-2xl border
                      border-slate-200 bg-slate-50 p-4
                      dark:border-white/10 dark:bg-white/[0.04]
                    "
                  >
                    <div>
                      <span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Purchase Cost
                      </span>
                      <span className="mt-1 block font-mono text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        PKR {Number(book.purchase_cost || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[9px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Sale Price
                      </span>
                      <span className="mt-1 block font-mono text-sm font-extrabold text-amber-700 dark:text-amber-300">
                        PKR {Number(book.sale_price || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="
                    flex items-center justify-between gap-3 border-t
                    border-slate-200 bg-slate-50/90 px-5 py-3
                    dark:border-white/10 dark:bg-white/[0.035]
                  "
                >
                  <div className="min-w-0 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <div className="truncate">Code: {book.book_number}</div>
                    <div className="truncate">Grade: {className}</div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(book)}
                      className="
                        grid h-9 w-9 place-items-center rounded-xl border
                        border-slate-300 bg-white text-slate-600 shadow-sm
                        transition hover:border-amber-300 hover:bg-amber-50
                        hover:text-amber-800
                        dark:border-white/15 dark:bg-white/[0.05]
                        dark:text-slate-300
                        dark:hover:border-amber-300/30
                        dark:hover:bg-amber-300/10
                        dark:hover:text-amber-200
                      "
                      title="Edit Book Details"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {hasHistory ? (
                      <button
                        type="button"
                        onClick={() => toggleDeactivateBook(book)}
                        className={`grid h-9 w-9 place-items-center rounded-xl border shadow-sm transition ${
                          book.status === "active"
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                        }`}
                        title={
                          book.status === "active"
                            ? "Deactivate Book"
                            : "Activate Book"
                        }
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteBook(book.id)}
                        className="
                          grid h-9 w-9 place-items-center rounded-xl border
                          border-rose-200 bg-rose-50 text-rose-700
                          shadow-sm transition hover:bg-rose-100
                          dark:border-rose-400/20
                          dark:bg-rose-400/10 dark:text-rose-200
                        "
                        title="Delete Book permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {isFormOpen && (
        <ScreenModalPortal
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !loading
            ) {
              setIsFormOpen(false);
            }
          }}
        >
          <div
            className="
              relative flex max-h-[92vh] w-full max-w-2xl
              flex-col overflow-hidden rounded-[2rem]
              border border-amber-200/80 bg-white
              shadow-[0_35px_120px_rgba(15,23,42,0.40)]
              dark:border-amber-300/20 dark:bg-[#10263c]
              dark:shadow-[0_35px_120px_rgba(0,0,0,0.60)]
            "
          >
            <div
              className="
                relative overflow-hidden border-b border-amber-200/80
                bg-[linear-gradient(135deg,#fffdf8_0%,#fff8e8_52%,#eef4ff_100%)]
                px-6 py-5
                dark:border-amber-300/15
                dark:bg-[linear-gradient(135deg,#081827_0%,#0c2238_55%,#10283f_100%)]
              "
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full border border-amber-300/20" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="
                      grid h-11 w-11 shrink-0 place-items-center
                      rounded-2xl border border-amber-300/70
                      bg-white text-amber-700 shadow-sm
                      dark:border-amber-300/25
                      dark:bg-amber-300/10 dark:text-amber-300
                    "
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                      {editingBook
                        ? `Edit Book: ${editingBook.book_number}`
                        : "Register New Book"}
                    </h2>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                      Register book details only. Add physical quantity later
                      from the Add Stock page.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={loading}
                  className="
                    grid h-10 w-10 shrink-0 place-items-center
                    rounded-2xl border border-slate-300 bg-white
                    text-slate-600 shadow-sm transition
                    hover:border-amber-300 hover:bg-amber-50
                    hover:text-amber-800 disabled:opacity-50
                    dark:border-white/15 dark:bg-white/[0.05]
                    dark:text-slate-300
                    dark:hover:border-amber-300/30
                    dark:hover:bg-amber-300/10
                    dark:hover:text-amber-200
                  "
                  aria-label="Close book form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSaveBook}
              className="
                min-h-0 flex-1 space-y-5 overflow-y-auto
                bg-white p-6 text-slate-950
                dark:bg-[#10263c] dark:text-slate-100
              "
            >
              <div
                className="
                  rounded-2xl border border-blue-200 bg-blue-50 p-4
                  text-xs font-bold leading-6 text-blue-950
                  dark:border-blue-400/20 dark:bg-blue-400/10
                  dark:text-blue-100
                "
              >
                Register the title and pricing here. Stock quantity remains
                managed through Add Stock.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>
                    Book Title *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="Example: Physics Grade 15"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Publisher *
                  </label>

                  <select
                    required
                    value={publisherId}
                    onChange={(event) =>
                      setPublisherId(event.target.value)
                    }
                    className={INPUT_CLASS}
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
                  <label className={LABEL_CLASS}>
                    Category *
                  </label>

                  <select
                    required
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(event.target.value)
                    }
                    className={INPUT_CLASS}
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
                  <label className={LABEL_CLASS}>
                    Subject *
                  </label>

                  <select
                    required
                    value={subjectId}
                    onChange={(event) =>
                      setSubjectId(event.target.value)
                    }
                    className={INPUT_CLASS}
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
                  <label className={LABEL_CLASS}>
                    Grade / Class *
                  </label>

                  <select
                    required
                    value={classId}
                    onChange={(event) => setClassId(event.target.value)}
                    className={INPUT_CLASS}
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
                  <label className={LABEL_CLASS}>
                    Purchase Cost (PKR) *
                  </label>

                  <div className="relative">
                    <BadgeDollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />

                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="Example: 350"
                      value={purchaseCost}
                      onChange={(event) =>
                        setPurchaseCost(
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        )
                      }
                      className={`${INPUT_CLASS} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Sale Price (PKR) *
                  </label>

                  <div className="relative">
                    <BadgeDollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />

                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="Example: 450"
                      value={salePrice}
                      onChange={(event) =>
                        setSalePrice(
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        )
                      }
                      className={`${INPUT_CLASS} pl-11`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={loading}
                  className="
                    inline-flex items-center justify-center rounded-2xl
                    border border-slate-300 bg-white px-5 py-3
                    text-sm font-extrabold text-slate-800 shadow-sm
                    transition hover:border-slate-400 hover:bg-slate-100
                    disabled:opacity-50
                    dark:border-white/15 dark:bg-white/[0.05]
                    dark:text-slate-200 dark:hover:bg-white/10
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-2xl border border-amber-400
                    bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
                    px-6 py-3 text-sm font-extrabold text-slate-950
                    shadow-[0_12px_30px_rgba(180,123,24,0.24)]
                    transition hover:-translate-y-0.5 hover:brightness-105
                    disabled:cursor-not-allowed disabled:opacity-50
                    disabled:hover:translate-y-0
                    dark:border-amber-300/40 dark:text-[#081827]
                  "
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                  )}

                  <span>
                    {editingBook ? "Save Book" : "Register Book"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </ScreenModalPortal>
      )}
    </div>
  );
}

function BookMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className={SOFT_PANEL_CLASS + " min-w-0 p-3"}>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" />

        <span className="truncate text-[9px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>

      <p
        className="mt-1 truncate text-xs font-extrabold text-slate-900 dark:text-white"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}