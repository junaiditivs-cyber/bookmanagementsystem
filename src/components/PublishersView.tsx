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

      const response = await fetch(url, {
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
      const response = await fetch(`/api/publishers/${publisher.id}`, {
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
      const response = await fetch(`/api/publishers/${publisher.id}`, {
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
    <div id="publishers-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            <span>Publishers</span>
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Manage publishers for book registration and Stock In entries.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-center shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Publisher</span>
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
              placeholder="Search publisher by name, code, phone, email, or contact person..."
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
          <span>Publishers Count:</span>
          <span className="text-rose-600 font-extrabold font-mono">
            {filteredPublishers.length}
          </span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Publisher Name</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5 text-center">Books</th>
                <th className="px-5 py-3.5 text-center">Stock</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPublishers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10 text-slate-400 font-mono"
                  >
                    No publishers found.
                  </td>
                </tr>
              ) : (
                filteredPublishers.map((publisher) => {
                  const bookCount = getPublisherBookCount(publisher.id);
                  const stockCount = getPublisherStockCount(publisher.id);

                  return (
                    <tr key={publisher.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-[10px]">
                        {publisher.publisher_number}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {publisher.publisher_name}
                        </p>

                        {publisher.address && (
                          <p className="mt-0.5 text-[10px] text-slate-400 font-semibold max-w-[260px] truncate">
                            {publisher.address}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-slate-600 font-semibold">
                          {publisher.contact_person || "-"}
                        </p>

                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {publisher.phone || ""}
                        </p>

                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          {publisher.email || ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-center font-mono font-extrabold text-slate-700">
                        {bookCount}
                      </td>

                      <td className="px-5 py-4 text-center font-mono font-extrabold text-blue-600">
                        {stockCount}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            publisher.status === "active"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : "bg-rose-50 text-rose-600 border-rose-200"
                          }`}
                        >
                          {publisher.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right space-x-1.5 no-print">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(publisher)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors inline-flex cursor-pointer border border-transparent"
                          title="Edit Publisher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {bookCount === 0 && stockCount === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePublisher(publisher)}
                            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex cursor-pointer border border-transparent"
                            title="Delete Publisher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleDeactivate(publisher)}
                            className={`p-1.5 rounded-lg transition-colors inline-flex cursor-pointer border border-transparent ${
                              publisher.status === "active"
                                ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={
                              publisher.status === "active"
                                ? "Deactivate Publisher"
                                : "Activate Publisher"
                            }
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/60 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl bg-white">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {editingPublisher
                    ? `Edit Publisher: ${editingPublisher.publisher_number}`
                    : "Add Publisher"}
                </h2>

                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Publisher will be used in Books and Stock In pages.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Publisher Name *
                  </label>

                  <input
                    type="text"
                    required
                    value={publisherName}
                    onChange={(event) => setPublisherName(event.target.value)}
                    placeholder="Example: Oxford University Press"
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Contact Person
                  </label>

                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(event) => setContactPerson(event.target.value)}
                    placeholder="Example: Junaid"
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Phone
                  </label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Example: 0300 0000000"
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Example: sales@example.com"
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Office / dispatch address"
                    rows={2}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Credit Days
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={creditDays}
                    onChange={(event) => setCreditDays(Number(event.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as "active" | "inactive")
                    }
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={loading}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 btn-premium-pink text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Saving..." : "Save Publisher"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}