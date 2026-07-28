import React, { useState } from "react";
import {
  Users,
  Plus,
  Edit2,
  ShieldAlert,
  X,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { DatabaseSchema, Publisher } from "../types";
import { apiFetch } from "../api/http";

import ScreenModalPortal from "./ui/ScreenModalPortal";
interface PublishersViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const result = await response.json();
    return result?.error || result?.message || fallback;
  } catch {
    return fallback;
  }
}

export default function PublishersView({
  data,
  onRefresh,
  onShowNotification,
}: PublishersViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState<Publisher | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [publisherName, setPublisherName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [creditDays, setCreditDays] = useState<number>(0);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEditingPublisher(null);
    setPublisherName("");
    setContactPerson("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCreditDays(0);
    setStatus("active");
    setLoading(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (publisher: Publisher) => {
    setEditingPublisher(publisher);
    setPublisherName(publisher.publisher_name || "");
    setContactPerson(publisher.contact_person || "");
    setPhone(publisher.phone || "");
    setEmail(publisher.email || "");
    setAddress(publisher.address || "");
    setCreditDays(Number(publisher.credit_days || 0));
    setStatus(publisher.status || "active");
    setLoading(false);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (loading) return;

    setIsFormOpen(false);
    resetForm();
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanPublisherName = publisherName.trim();

    if (!cleanPublisherName) {
      onShowNotification("Publisher name is required.", "error");
      return;
    }

    const duplicatePublisher = data.publishers.find((publisher) => {
      const sameName =
        publisher.publisher_name.trim().toLowerCase() ===
        cleanPublisherName.toLowerCase();

      const differentRecord = editingPublisher
        ? publisher.id !== editingPublisher.id
        : true;

      return sameName && differentRecord;
    });

    if (duplicatePublisher) {
      onShowNotification("This publisher name already exists.", "error");
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const url = editingPublisher
        ? `/api/publishers/${editingPublisher.id}`
        : "/api/publishers";

      const method = editingPublisher ? "PUT" : "POST";

      const payload = {
        publisher_name: cleanPublisherName,
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        credit_days: Number(creditDays) || 0,
        status,
      };

      const response = await apiFetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to save publisher."
        );

        throw new Error(message);
      }

      onShowNotification(
        editingPublisher
          ? "Publisher updated successfully."
          : "Publisher added successfully.",
        "success"
      );

      setIsFormOpen(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      if (error?.name === "AbortError") {
        onShowNotification(
          "Server did not respond. Please check terminal/backend route /api/publishers.",
          "error"
        );
      } else {
        onShowNotification(error?.message || "Failed to save publisher.", "error");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const toggleDeactivate = async (publisher: Publisher) => {
    const newStatus = publisher.status === "active" ? "inactive" : "active";

    try {
      const response = await apiFetch(`/api/publishers/${publisher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to change publisher status."
        );

        throw new Error(message);
      }

      onShowNotification(`Publisher status changed to ${newStatus}.`, "success");
      onRefresh();
    } catch (error: any) {
      onShowNotification(
        error?.message || "Failed to change publisher status.",
        "error"
      );
    }
  };

  const handleDeletePublisher = async (publisher: Publisher) => {
    const linkedBooks = data.books.filter((book) => book.publisher_id === publisher.id);

    if (linkedBooks.length > 0) {
      onShowNotification(
        "This publisher has books linked with it. Deactivate it instead of deleting.",
        "error"
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to permanently delete this publisher?"
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/api/publishers/${publisher.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to delete publisher."
        );

        throw new Error(message);
      }

      onShowNotification("Publisher deleted successfully.", "success");
      onRefresh();
    } catch (error: any) {
      onShowNotification(error?.message || "Failed to delete publisher.", "error");
    }
  };

  const filteredPublishers = data.publishers.filter((publisher) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return (
      publisher.publisher_name.toLowerCase().includes(query) ||
      publisher.publisher_number.toLowerCase().includes(query) ||
      (publisher.contact_person || "").toLowerCase().includes(query) ||
      (publisher.phone || "").toLowerCase().includes(query) ||
      (publisher.email || "").toLowerCase().includes(query)
    );
  });

  const getPublisherBookCount = (publisherId: string) => {
    return data.books.filter((book) => book.publisher_id === publisherId).length;
  };

  const getPublisherStockCount = (publisherId: string) => {
    const publisherBookIds = data.books
      .filter((book) => book.publisher_id === publisherId)
      .map((book) => book.id);

    return data.stock_balances
      .filter((stockBalance) => publisherBookIds.includes(stockBalance.book_id))
      .reduce((sum, stockBalance) => sum + Number(stockBalance.quantity || 0), 0);
  };

  return (
    <div id="publishers-view" className="space-y-6 pb-12 animate-fadeIn">
      {/* PAGE HERO */}
      <section className="relative overflow-hidden rounded-[2rem] border border-amber-300 bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.11),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.08),transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_34%)]" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 shadow-[0_12px_28px_rgba(180,123,24,0.15)] dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-300">
              <Users className="h-7 w-7" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200">
                <Users className="h-3.5 w-3.5" />
                Publisher catalog
              </div>

              <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Publishers
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Manage publisher records used across book registration, purchasing, stock intake, and reporting.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-amber-400 bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)] px-5 py-3 text-sm font-extrabold text-slate-950 shadow-[0_14px_32px_rgba(180,123,24,0.24)] transition hover:-translate-y-0.5 hover:brightness-105 dark:border-amber-300/40 dark:text-[#081827] lg:self-center"
          >
            <Plus className="h-4 w-4" />
            Add Publisher
          </button>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Publishers</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{data.publishers.length.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">All publisher records</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Active Publishers</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
            {data.publishers.filter((publisher) => publisher.status === "active").length.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Available for new books</p>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Linked Books</p>
          <p className="mt-2 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">{data.books.length.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Titles assigned to publishers</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-[0_14px_35px_rgba(15,23,42,0.09)] dark:border-amber-300/15 dark:bg-[#10263c]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <Search className="h-5 w-5" />
          </div>

          <input
            type="text"
            placeholder="Search by name, code, phone, email, or contact person..."
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

      {/* PUBLISHERS TABLE */}
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#10263c]">
        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-white/10 dark:bg-[#10263c] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              Publisher Directory
            </h2>
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Contact details, linked books, stock totals, status, and actions.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-extrabold text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
            Total records: {filteredPublishers.length}
          </span>
        </div>

        <div className="overflow-x-auto premium-scroll">
          <table className="min-w-[980px] w-full text-left">
            <thead className="bg-slate-950 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-300">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Publisher</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4 text-center">Books</th>
                <th className="px-5 py-4 text-center">Stock</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filteredPublishers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-sm font-extrabold text-slate-700 dark:text-slate-200">
                      No publishers found
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Try changing the search term or add a new publisher.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPublishers.map((publisher) => {
                  const bookCount = getPublisherBookCount(publisher.id);
                  const stockCount = getPublisherStockCount(publisher.id);

                  return (
                    <tr
                      key={publisher.id}
                      className="transition hover:bg-amber-50/40 dark:hover:bg-amber-300/[0.04]"
                    >
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[10px] font-extrabold text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                          {publisher.publisher_number}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">
                          {publisher.publisher_name}
                        </p>

                        {publisher.address && (
                          <p className="mt-1 max-w-[280px] truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {publisher.address}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {publisher.contact_person || "-"}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {publisher.phone || "No phone"}
                        </p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {publisher.email || "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="font-mono text-sm font-extrabold text-slate-800 dark:text-white">
                          {bookCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="font-mono text-sm font-extrabold text-blue-700 dark:text-blue-200">
                          {stockCount.toLocaleString()}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${
                            publisher.status === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200"
                              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200"
                          }`}
                        >
                          {publisher.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5 no-print">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(publisher)}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-300 dark:hover:border-blue-300/30 dark:hover:bg-blue-300/10 dark:hover:text-blue-200"
                            title="Edit Publisher"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          {bookCount === 0 && stockCount === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleDeletePublisher(publisher)}
                              className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 dark:border-rose-300/20 dark:bg-[#10263c] dark:text-rose-200 dark:hover:bg-rose-300/10"
                              title="Delete Publisher"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleDeactivate(publisher)}
                              className={`grid h-9 w-9 place-items-center rounded-xl border transition ${
                                publisher.status === "active"
                                  ? "border-rose-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-rose-300/20 dark:bg-[#10263c] dark:text-rose-200 dark:hover:bg-rose-300/10"
                                  : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 dark:border-emerald-300/20 dark:bg-[#10263c] dark:text-emerald-200 dark:hover:bg-emerald-300/10"
                              }`}
                              title={
                                publisher.status === "active"
                                  ? "Deactivate Publisher"
                                  : "Activate Publisher"
                              }
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ADD / EDIT MODAL */}
      {isFormOpen && (
        <ScreenModalPortal>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/20 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] dark:bg-slate-950">
            <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 dark:border-white/10">
              <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-200">
                    {editingPublisher ? (
                      <Edit2 className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">
                      Publisher Record
                    </p>
                    <h2 className="mt-1 font-display text-xl font-extrabold text-white">
                      {editingPublisher
                        ? `Edit ${editingPublisher.publisher_number}`
                        : "Add Publisher"}
                    </h2>
                    <p className="mt-1 text-xs text-slate-300">
                      Used in Books, Stock In, and publisher reporting.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={loading}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 transition hover:bg-white/[0.12] hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Publisher Name *
                  </span>
                  <input
                    type="text"
                    required
                    value={publisherName}
                    onChange={(event) => setPublisherName(event.target.value)}
                    placeholder="Example: Oxford University Press"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Contact Person
                  </span>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(event) => setContactPerson(event.target.value)}
                    placeholder="Example: Junaid"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Phone
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Example: 0300 0000000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Example: sales@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Address
                  </span>
                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Office or dispatch address"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Credit Days
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={creditDays}
                    onChange={(event) => setCreditDays(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-[#10263c] dark:text-white dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as "active" | "inactive")
                    }
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-amber-300/60 dark:focus:ring-amber-300/10"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-[#10263c] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-sm font-extrabold text-slate-950 shadow-[0_12px_30px_rgba(245,158,11,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Saving..." : "Save Publisher"}
                </button>
              </div>
            </form>
          </div>
        </ScreenModalPortal>
      )}
    </div>
  );
}