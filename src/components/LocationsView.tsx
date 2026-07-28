import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit2,
  Landmark,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";
import { DatabaseSchema, Location } from "../types";
import { apiFetch } from "../api/http";

import ScreenModalPortal from "./ui/ScreenModalPortal";
interface LocationsViewProps {
  data: DatabaseSchema;
  onRefresh: () => void;
  onShowNotification: (msg: string, type: "success" | "error") => void;
}

const INPUT_CLASS =
  "h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-500 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10 dark:[color-scheme:dark]";

const PANEL_CLASS =
  "locations-panel rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_26px_78px_rgba(0,0,0,0.44)]";

const SOFT_PANEL_CLASS =
  "rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#10263c]";

const LABEL_CLASS =
  "locations-readable mb-2 block text-xs font-extrabold text-slate-900 dark:text-slate-100";

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
  const [type, setType] = useState<"warehouse" | "shop" | "school">(
    "warehouse",
  );
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
      const sameName =
        location.name.trim().toLowerCase() === cleanName.toLowerCase();

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
        const message = await getErrorMessage(
          response,
          "Failed to save location.",
        );
        throw new Error(message);
      }

      onShowNotification(
        editingLocation
          ? "Location updated successfully."
          : "Location added successfully.",
        "success",
      );

      setIsFormOpen(false);
      resetForm();
      onRefresh();
    } catch (error: any) {
      if (error?.name === "AbortError") {
        onShowNotification(
          "Server did not respond. Please check backend route /api/locations in server.ts.",
          "error",
        );
      } else {
        onShowNotification(
          error?.message || "Failed to save location.",
          "error",
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const toggleDeactivate = async (location: Location) => {
    const newStatus =
      location.status === "active" ? "inactive" : "active";

    try {
      const response = await apiFetch(
        `/api/locations/${location.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to change location status.",
        );

        throw new Error(message);
      }

      onShowNotification(
        `Location status changed to ${newStatus}.`,
        "success",
      );
      onRefresh();
    } catch (error: any) {
      onShowNotification(
        error?.message || "Failed to change location status.",
        "error",
      );
    }
  };

  const getLocationStockQty = (locationId: string) => {
    return (data.stock_balances || [])
      .filter(
        (stockBalance) =>
          stockBalance.location_id === locationId,
      )
      .reduce(
        (sum, stockBalance) =>
          sum + Number(stockBalance.quantity || 0),
        0,
      );
  };

  const isLocationUsed = (locationId: string) => {
    const stockQty = getLocationStockQty(locationId);

    const hasHistory = (data.stock_history || []).some(
      (history) => history.location_id === locationId,
    );

    const hasSales = (data.sales || []).some(
      (sale) => sale.location_id === locationId,
    );

    const hasCustomerReturns = (data.customer_returns || []).some(
      (returnRow) => returnRow.location_id === locationId,
    );

    const hasPublisherReturns = (data.publisher_returns || []).some(
      (returnRow) => returnRow.location_id === locationId,
    );

    const hasTransfers = (data.stock_transfers || []).some(
      (transfer) => {
        return (
          transfer.from_location_id === locationId ||
          transfer.to_location_id === locationId
        );
      },
    );

    const hasDamageRecords = (data.damage_loss_records || []).some(
      (damage) => damage.location_id === locationId,
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
        "error",
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to permanently delete this location?",
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(
        `/api/locations/${location.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const message = await getErrorMessage(
          response,
          "Failed to delete location.",
        );

        throw new Error(message);
      }

      onShowNotification(
        "Location deleted successfully.",
        "success",
      );
      onRefresh();
    } catch (error: any) {
      onShowNotification(
        error?.message || "Failed to delete location.",
        "error",
      );
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
      (location.contact_person || "")
        .toLowerCase()
        .includes(query) ||
      (location.phone || "").toLowerCase().includes(query) ||
      location.type.toLowerCase().includes(query)
    );
  });

  const activeLocationCount = data.locations.filter(
    (location) => location.status === "active",
  ).length;

  const totalStockAcrossLocations = data.locations.reduce(
    (sum, location) =>
      sum + getLocationStockQty(location.id),
    0,
  );

  return (
    <div
      id="locations-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{`
        #locations-view .locations-readable {
          color: #0f172a !important;
        }

        #locations-view .locations-muted {
          color: #475569 !important;
        }

        #locations-view .locations-panel {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }

        #locations-view input,
        #locations-view select,
        #locations-view textarea {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #cbd5e1 !important;
        }

        #locations-view input::placeholder,
        #locations-view textarea::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        html.dark #locations-view .locations-readable {
          color: #f8fafc !important;
        }

        html.dark #locations-view .locations-muted {
          color: #cbd5e1 !important;
        }

        html.dark #locations-view .locations-panel {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
        }

        html.dark #locations-view input,
        html.dark #locations-view select,
        html.dark #locations-view textarea {
          background-color: #10263c !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
        }

        html.dark #locations-view input::placeholder,
        html.dark #locations-view textarea::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        html.dark #locations-view option {
          background-color: #0f2236 !important;
          color: #ffffff !important;
        }
      `}</style>

      <section
        className="
          relative overflow-hidden rounded-[2rem] border
          border-amber-300 bg-white px-6 py-6
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
                rounded-2xl border border-amber-300 bg-amber-50
                text-amber-800
                shadow-[0_12px_28px_rgba(180,123,24,0.16)]
                dark:border-amber-300/25
                dark:bg-amber-300/10 dark:text-amber-300
              "
            >
              <Warehouse className="h-7 w-7" />
            </div>

            <div>
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300 bg-amber-50 px-3 py-1
                  text-[9px] font-black uppercase tracking-[0.22em]
                  text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-200
                "
              >
                <Landmark className="h-3.5 w-3.5" />
                Storage network
              </div>

              <h1 className="locations-readable mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
                Warehouses & Locations
              </h1>

              <p className="locations-muted mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                Manage warehouses, shops, and school locations used
                for Stock In, Sales, Transfers, and inventory records.
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
            <span>Add Warehouse</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Locations"
          value={data.locations.length}
          helper="All registered storage points"
          icon={Building2}
        />

        <SummaryCard
          title="Active Locations"
          value={activeLocationCount}
          helper="Currently available for use"
          icon={CheckCircle2}
        />

        <SummaryCard
          title="Total Stock Units"
          value={totalStockAcrossLocations}
          helper="Combined units across locations"
          icon={Warehouse}
        />
      </div>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className={`${PANEL_CLASS} flex-1 px-4 py-3`}>
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11 shrink-0 items-center justify-center
                rounded-2xl border border-amber-300 bg-amber-50
                text-amber-800
                dark:border-amber-300/25
                dark:bg-amber-300/10 dark:text-amber-300
              "
            >
              <Search className="h-5 w-5" />
            </div>

            <input
              type="text"
              placeholder="Search by name, code, type, city, address, or contact..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="
                h-11 w-full border-0 bg-transparent text-sm
                font-bold text-slate-950 outline-none
                placeholder:text-slate-500 focus:ring-0
                dark:text-white dark:placeholder:text-slate-400
              "
            />

            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="
                  rounded-xl border border-slate-300 bg-white
                  px-3 py-2 text-[10px] font-extrabold
                  text-slate-700 transition
                  hover:border-amber-300 hover:bg-amber-50
                  hover:text-amber-800
                  dark:border-white/15 dark:bg-[#10263c]
                  dark:text-slate-200
                  dark:hover:border-amber-300/30
                  dark:hover:bg-amber-300/10
                  dark:hover:text-amber-200
                "
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div
          className="
            inline-flex items-center gap-2 rounded-2xl border
            border-slate-300 bg-white px-4 py-4 text-xs
            font-semibold text-slate-700 shadow-sm
            dark:border-amber-300/20 dark:bg-[#081827]
            dark:text-slate-200
          "
        >
          <span>Visible Locations:</span>
          <span className="font-mono text-base font-extrabold text-amber-800 dark:text-amber-300">
            {filteredLocations.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredLocations.length === 0 ? (
          <div
            className="
              col-span-full rounded-[2rem] border border-dashed
              border-slate-300 bg-white py-16 text-center
              shadow-sm dark:border-white/15 dark:bg-[#081827]
            "
          >
            <MapPin className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" />

            <p className="locations-readable mt-4 text-sm font-extrabold text-slate-800 dark:text-white">
              No warehouses found
            </p>

            <p className="locations-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              Try another search term or add a new location.
            </p>
          </div>
        ) : (
          filteredLocations.map((location) => {
            const stockQty = getLocationStockQty(location.id);
            const locationUsed = isLocationUsed(location.id);

            return (
              <article
                key={location.id}
                className={`
                  ${PANEL_CLASS}
                  group flex min-h-[310px] flex-col justify-between
                  overflow-hidden p-5 transition
                  hover:-translate-y-1 hover:border-amber-400
                  hover:shadow-[0_26px_65px_rgba(180,123,24,0.14)]
                  dark:hover:border-amber-300/35
                `}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="
                        rounded-xl border border-amber-300
                        bg-amber-50 px-2.5 py-1 font-mono
                        text-[10px] font-extrabold text-amber-800
                        shadow-sm
                        dark:border-amber-300/25
                        dark:bg-amber-300/10 dark:text-amber-200
                      "
                    >
                      {location.code}
                    </span>

                    <div className="flex flex-wrap justify-end gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                          location.type === "warehouse"
                            ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
                            : location.type === "shop"
                              ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                              : "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200"
                        }`}
                      >
                        {location.type}
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${
                          location.status === "active"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                            : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                        }`}
                      >
                        {location.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-4">
                    <div
                      className="
                        grid h-12 w-12 shrink-0 place-items-center
                        rounded-2xl border border-slate-200
                        bg-slate-50 text-slate-700
                        dark:border-white/10 dark:bg-[#10263c]
                        dark:text-amber-300
                      "
                    >
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="locations-readable text-base font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                        {location.name}
                      </h3>

                      <p className="locations-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Registered {location.type} location
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {(location.city || location.address) && (
                      <InfoRow icon={MapPin}>
                        <span>
                          {location.city}
                          {location.city && location.address
                            ? ", "
                            : ""}
                          {location.address}
                        </span>
                      </InfoRow>
                    )}

                    {location.contact_person && (
                      <InfoRow icon={UserRound}>
                        <span>
                          Contact:{" "}
                          <strong className="locations-readable font-extrabold text-slate-950 dark:text-white">
                            {location.contact_person}
                          </strong>
                        </span>
                      </InfoRow>
                    )}

                    {location.phone && (
                      <InfoRow icon={Phone}>
                        <span>{location.phone}</span>
                      </InfoRow>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-200 pt-4 dark:border-white/10">
                  <div className={SOFT_PANEL_CLASS + " min-w-0 px-4 py-3"}>
                    <span className="locations-muted block text-[9px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      Total Stock Units
                    </span>

                    <span className="locations-readable mt-1 block font-mono text-xl font-extrabold text-slate-950 dark:text-white">
                      {stockQty.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(location)}
                      className="
                        grid h-10 w-10 place-items-center
                        rounded-xl border border-slate-300
                        bg-white text-slate-700 shadow-sm
                        transition hover:border-amber-300
                        hover:bg-amber-50 hover:text-amber-800
                        dark:border-white/15 dark:bg-[#10263c]
                        dark:text-slate-200
                        dark:hover:border-amber-300/30
                        dark:hover:bg-amber-300/10
                        dark:hover:text-amber-200
                      "
                      title="Edit Warehouse"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {!locationUsed ? (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteLocation(location)
                        }
                        className="
                          grid h-10 w-10 place-items-center
                          rounded-xl border border-rose-200
                          bg-rose-50 text-rose-700 shadow-sm
                          transition hover:bg-rose-100
                          dark:border-rose-400/20
                          dark:bg-rose-400/10
                          dark:text-rose-200
                        "
                        title="Delete Warehouse"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          toggleDeactivate(location)
                        }
                        className={`grid h-10 w-10 place-items-center rounded-xl border shadow-sm transition ${
                          location.status === "active"
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                        }`}
                        title={
                          location.status === "active"
                            ? "Deactivate Warehouse"
                            : "Activate Warehouse"
                        }
                      >
                        <ShieldAlert className="h-4 w-4" />
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
              closeForm();
            }
          }}
        >
          <div
            className="
              locations-panel flex max-h-[92vh] w-full
              max-w-xl flex-col overflow-hidden rounded-[2rem]
              border border-amber-300 bg-white
              shadow-[0_35px_120px_rgba(15,23,42,0.45)]
              dark:border-amber-300/20 dark:bg-[#081827]
              dark:shadow-[0_38px_125px_rgba(0,0,0,0.65)]
            "
          >
            <div
              className="
                relative overflow-hidden border-b
                border-amber-200 bg-white px-6 py-5
                dark:border-amber-300/15 dark:bg-[#0d2135]
              "
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_42%)]" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="
                      grid h-11 w-11 shrink-0 place-items-center
                      rounded-2xl border border-amber-300
                      bg-amber-50 text-amber-800
                      dark:border-amber-300/25
                      dark:bg-amber-300/10
                      dark:text-amber-300
                    "
                  >
                    <Warehouse className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="locations-readable text-lg font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                      {editingLocation
                        ? `Edit Warehouse: ${editingLocation.code}`
                        : "Add Warehouse"}
                    </h2>

                    <p className="locations-muted mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
                      This location will be available for Stock In,
                      Sales, Transfers, and reporting.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={loading}
                  className="
                    grid h-10 w-10 shrink-0 place-items-center
                    rounded-2xl border border-slate-300 bg-white
                    text-slate-700 shadow-sm transition
                    hover:border-amber-300 hover:bg-amber-50
                    hover:text-amber-800 disabled:opacity-50
                    dark:border-white/15 dark:bg-[#10263c]
                    dark:text-slate-200
                    dark:hover:border-amber-300/30
                    dark:hover:bg-amber-300/10
                    dark:hover:text-amber-200
                  "
                  aria-label="Close location form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className="
                min-h-0 flex-1 space-y-5 overflow-y-auto
                bg-white p-6 text-slate-950
                dark:bg-[#081827] dark:text-slate-100
              "
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>
                    Warehouse Name *
                  </label>

                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Example: Main Warehouse or Main Shop"
                    className={INPUT_CLASS}
                    autoFocus
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Location Type *
                  </label>

                  <select
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target.value as
                          | "warehouse"
                          | "shop"
                          | "school",
                      )
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="warehouse">Warehouse</option>
                    <option value="shop">Shop</option>
                    <option value="school">School</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Status</label>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as
                          | "active"
                          | "inactive",
                      )
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>City</label>

                  <input
                    type="text"
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    placeholder="Example: Lahore"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>Phone</label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="Contact number"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Address</label>

                  <input
                    type="text"
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value)
                    }
                    placeholder="Physical address"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>
                    Contact Person
                  </label>

                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(event) =>
                      setContactPerson(event.target.value)
                    }
                    placeholder="Example: Muhammad Yasir"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={loading}
                  className="
                    inline-flex items-center justify-center
                    rounded-2xl border border-slate-300
                    bg-white px-5 py-3 text-sm font-extrabold
                    text-slate-800 shadow-sm transition
                    hover:border-slate-400 hover:bg-slate-100
                    disabled:opacity-50
                    dark:border-white/15 dark:bg-[#10263c]
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
                    px-6 py-3 text-sm font-extrabold
                    text-slate-950
                    shadow-[0_12px_30px_rgba(180,123,24,0.24)]
                    transition hover:-translate-y-0.5
                    hover:brightness-105
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    disabled:hover:translate-y-0
                    dark:border-amber-300/40
                    dark:text-[#081827]
                  "
                >
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  <span>
                    {loading
                      ? "Saving..."
                      : "Save Warehouse"}
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

function SummaryCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: number;
  helper: string;
  icon: React.ElementType;
}) {
  return (
    <div className={PANEL_CLASS + " p-5"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="locations-muted text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
            {title}
          </p>

          <p className="locations-readable mt-3 font-mono text-2xl font-extrabold text-slate-950 dark:text-white">
            {value.toLocaleString()}
          </p>

          <p className="locations-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {helper}
          </p>
        </div>

        <div
          className="
            grid h-11 w-11 place-items-center rounded-2xl
            border border-amber-300 bg-amber-50
            text-amber-800
            dark:border-amber-300/25
            dark:bg-amber-300/10 dark:text-amber-300
          "
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="locations-muted flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}