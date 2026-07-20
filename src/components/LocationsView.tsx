import React, { useState } from "react";
import {
  Building2,
  Plus,
  Edit2,
  ShieldAlert,
  X,
  Search,
  MapPin,
  Trash2,
  Loader2,
} from "lucide-react";
import { DatabaseSchema, Location } from "../types";
import { apiFetch } from "../api/http";

interface LocationsViewProps {
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

export default function LocationsView({
  data,
  onRefresh,
  onShowNotification,
}: LocationsViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<"warehouse" | "shop" | "school">("warehouse");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setEditingLocation(null);
    setName("");
    setType("warehouse");
    setCity("");
    setAddress("");
    setContactPerson("");
    setPhone("");
    setStatus("active");
    setLoading(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setName(location.name || "");
    setType(location.type || "warehouse");
    setCity(location.city || "");
    setAddress(location.address || "");
    setContactPerson(location.contact_person || "");
    setPhone(location.phone || "");
    setStatus(location.status || "active");
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

    const cleanName = name.trim();

    if (!cleanName) {
      onShowNotification("Location name is required.", "error");
      return;
    }

    const duplicateLocation = data.locations.find((location) => {
      const sameName = location.name.trim().toLowerCase() === cleanName.toLowerCase();

      const differentRecord = editingLocation
        ? location.id !== editingLocation.id
        : true;

      return sameName && differentRecord;
    });

    if (duplicateLocation) {
      onShowNotification("This location name already exists.", "error");
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : "/api/locations";

      const method = editingLocation ? "PUT" : "POST";

      const payload = {
        name: cleanName,
        type,
        city: city.trim(),
        address: address.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
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
        const message = await getErrorMessage(response, "Failed to save location.");
        throw new Error(message);
      }

      onShowNotification(
        editingLocation
          ? "Location updated successfully."
          : "Location added successfully.",
        "success"
      );

      setIsFormOpen(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      if (error?.name === "AbortError") {
        onShowNotification(
          "Server did not respond. Please check backend route /api/locations in server.ts.",
          "error"
        );
      } else {
        onShowNotification(error?.message || "Failed to save location.", "error");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const toggleDeactivate = async (location: Location) => {
    const newStatus = location.status === "active" ? "inactive" : "active";

    try {
      const response = await apiFetch(`/api/locations/${location.id}`, {
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
          "Failed to change location status."
        );

        throw new Error(message);
      }

      onShowNotification(`Location status changed to ${newStatus}.`, "success");
      onRefresh();
    } catch (error: any) {
      onShowNotification(
        error?.message || "Failed to change location status.",
        "error"
      );
    }
  };

  const getLocationStockQty = (locationId: string) => {
    return (data.stock_balances || [])
      .filter((stockBalance) => stockBalance.location_id === locationId)
      .reduce((sum, stockBalance) => sum + Number(stockBalance.quantity || 0), 0);
  };

  const isLocationUsed = (locationId: string) => {
    const stockQty = getLocationStockQty(locationId);

    const hasHistory = (data.stock_history || []).some(
      (history) => history.location_id === locationId
    );

    const hasSales = (data.sales || []).some(
      (sale) => sale.location_id === locationId
    );

    const hasCustomerReturns = (data.customer_returns || []).some(
      (returnRow) => returnRow.location_id === locationId
    );

    const hasPublisherReturns = (data.publisher_returns || []).some(
      (returnRow) => returnRow.location_id === locationId
    );

    const hasTransfers = (data.stock_transfers || []).some((transfer) => {
      return (
        transfer.from_location_id === locationId ||
        transfer.to_location_id === locationId
      );
    });

    const hasDamageRecords = (data.damage_loss_records || []).some(
      (damage) => damage.location_id === locationId
    );

    return (
      stockQty > 0 ||
      hasHistory ||
      hasSales ||
      hasCustomerReturns ||
      hasPublisherReturns ||
      hasTransfers ||
      hasDamageRecords
    );
  };

  const handleDeleteLocation = async (location: Location) => {
    if (isLocationUsed(location.id)) {
      onShowNotification(
        "This location has stock or transaction history. Deactivate it instead of deleting.",
        "error"
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to permanently delete this location?"
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/api/locations/${location.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to delete location."
        );

        throw new Error(message);
      }

      onShowNotification("Location deleted successfully.", "success");
      onRefresh();
    } catch (error: any) {
      onShowNotification(error?.message || "Failed to delete location.", "error");
    }
  };

  const filteredLocations = data.locations.filter((location) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return true;

    return (
      location.name.toLowerCase().includes(query) ||
      location.code.toLowerCase().includes(query) ||
      (location.city || "").toLowerCase().includes(query) ||
      (location.address || "").toLowerCase().includes(query) ||
      (location.contact_person || "").toLowerCase().includes(query) ||
      (location.phone || "").toLowerCase().includes(query) ||
      location.type.toLowerCase().includes(query)
    );
  });

  return (
    <div id="locations-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-rose-500" />
            <span>Warehouses</span>
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Manage storage locations for Stock In and Sales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4.5 py-2.5 btn-premium-pink text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-center shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Warehouse</span>
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
              placeholder="Search by warehouse name, code, type, city, address, or contact..."
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
          <span>Warehouses Count:</span>
          <span className="text-rose-600 font-extrabold font-mono">
            {filteredLocations.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLocations.length === 0 ? (
          <div className="col-span-full bg-slate-50 p-10 rounded-2xl border border-slate-200 text-center text-slate-400 font-mono text-xs">
            No warehouses found.
          </div>
        ) : (
          filteredLocations.map((location) => {
            const stockQty = getLocationStockQty(location.id);
            const locationUsed = isLocationUsed(location.id);

            return (
              <div
                key={location.id}
                className="glass-panel border border-white/60 rounded-2xl p-5 flex flex-col justify-between hover:border-rose-200 hover:shadow-md transition-all bg-white/50"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-mono font-bold text-xs bg-white px-2.5 py-1 rounded-lg text-slate-400 border border-slate-200 shadow-sm">
                      {location.code}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase border ${
                        location.type === "warehouse"
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : location.type === "shop"
                            ? "bg-amber-50 border-amber-200 text-amber-600"
                            : "bg-indigo-50 border-indigo-200 text-indigo-600"
                      }`}
                    >
                      {location.type}
                    </span>
                  </div>

                  <h3 className="text-slate-800 font-bold text-sm mt-3.5 tracking-tight">
                    {location.name}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500 font-medium">
                    {(location.city || location.address) && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {location.city}
                          {location.city && location.address ? ", " : ""}
                          {location.address}
                        </span>
                      </div>
                    )}

                    {location.contact_person && (
                      <div className="text-[11px] text-slate-400 font-bold">
                        Contact:{" "}
                        <span className="text-slate-700">
                          {location.contact_person}
                        </span>
                        {location.phone ? ` (${location.phone})` : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold font-mono text-slate-800">
                      {stockQty}
                    </div>

                    <div className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">
                      Total Stock Units
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(location)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-sm"
                      title="Edit Warehouse"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!locationUsed ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(location)}
                        className="p-1.5 text-rose-500 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-sm"
                        title="Delete Warehouse"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleDeactivate(location)}
                        className={`p-1.5 rounded-lg border border-slate-200 transition-all bg-white cursor-pointer shadow-sm ${
                          location.status === "active"
                            ? "text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            : "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={
                          location.status === "active"
                            ? "Deactivate Warehouse"
                            : "Activate Warehouse"
                        }
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {editingLocation
                    ? `Edit Warehouse: ${editingLocation.code}`
                    : "Add Warehouse"}
                </h2>

                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Warehouse will be used for Stock In and Sales.
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

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Warehouse Name *
                </label>

                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example: Main Warehouse or Main Shop"
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Location Type *
                </label>

                <select
                  value={type}
                  onChange={(event) => setType(event.target.value as "warehouse" | "shop" | "school")}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="warehouse">Warehouse</option>
                  <option value="shop">Shop</option>
                  <option value="school">School</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    City
                  </label>

                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Example: Lahore"
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
                    placeholder="Contact number"
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Address
                </label>

                <input
                  type="text"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Physical address"
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 text-xs focus:outline-none"
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
                  placeholder="Example: Muhammad Yasir"
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
                  <span>{loading ? "Saving..." : "Save Warehouse"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}