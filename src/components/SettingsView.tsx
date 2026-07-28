import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Database,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { apiFetch } from "../api/http";

interface SystemSettings {
  businessName: string;
  currency: string;
  taxRate: number;
  globalReorderLevel: number;
}

const defaultSettings: SystemSettings = {
  businessName: "Junaid Books Management System",
  currency: "PKR",
  taxRate: 0,
  globalReorderLevel: 20,
};

const PANEL_CLASS =
  "settings-panel rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_26px_78px_rgba(0,0,0,0.44)]";

const SOFT_PANEL_CLASS =
  "settings-soft-panel rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#10263c]";

const INPUT_CLASS =
  "settings-control h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-500 hover:border-amber-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-[#10263c] dark:text-white dark:placeholder:text-slate-400 dark:hover:border-amber-300/40 dark:focus:border-amber-300 dark:focus:ring-amber-300/10 dark:[color-scheme:dark]";

const LABEL_CLASS =
  "settings-readable mb-2 block text-xs font-extrabold text-slate-900 dark:text-slate-100";

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getResponseError(
  result: unknown,
  fallback: string,
): string {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof result.error === "string"
  ) {
    return result.error;
  }

  if (
    result &&
    typeof result === "object" &&
    "message" in result &&
    typeof result.message === "string"
  ) {
    return result.message;
  }

  return fallback;
}

export default function SettingsView() {
  const [businessName, setBusinessName] = useState(
    defaultSettings.businessName,
  );
  const [currency, setCurrency] = useState(
    defaultSettings.currency,
  );
  const [taxRate, setTaxRate] = useState(
    String(defaultSettings.taxRate),
  );
  const [globalReorderLevel, setGlobalReorderLevel] =
    useState(String(defaultSettings.globalReorderLevel));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadSettings = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch("/api/settings", {
          signal: controller.signal,
        });

        const result = await readJsonSafely(response);

        if (!response.ok) {
          throw new Error(
            getResponseError(
              result,
              `Unable to load settings. Server returned ${response.status}.`,
            ),
          );
        }

        if (!result || typeof result !== "object") {
          throw new Error(
            "Unable to load settings because the server returned an invalid response.",
          );
        }

        const settings = result as Partial<SystemSettings>;

        if (!active) return;

        setBusinessName(
          typeof settings.businessName === "string" &&
            settings.businessName.trim()
            ? settings.businessName
            : defaultSettings.businessName,
        );

        setCurrency(
          typeof settings.currency === "string" &&
            settings.currency.trim()
            ? settings.currency
            : defaultSettings.currency,
        );

        setTaxRate(
          String(
            Number.isFinite(Number(settings.taxRate))
              ? Number(settings.taxRate)
              : defaultSettings.taxRate,
          ),
        );

        setGlobalReorderLevel(
          String(
            Number.isFinite(Number(settings.globalReorderLevel))
              ? Number(settings.globalReorderLevel)
              : defaultSettings.globalReorderLevel,
          ),
        );
      } catch (loadError: unknown) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load settings.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSettings();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanBusinessName = businessName.trim();
    const parsedTaxRate = Number(taxRate);
    const parsedReorderLevel = Number(globalReorderLevel);

    setSaved(false);
    setError("");

    if (!cleanBusinessName) {
      setError("Business name is required.");
      return;
    }

    if (
      !Number.isFinite(parsedTaxRate) ||
      parsedTaxRate < 0 ||
      parsedTaxRate > 100
    ) {
      setError("Tax rate must be between 0 and 100.");
      return;
    }

    if (
      !Number.isInteger(parsedReorderLevel) ||
      parsedReorderLevel < 1
    ) {
      setError(
        "Global reorder level must be a whole number greater than 0.",
      );
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: cleanBusinessName,
          currency,
          taxRate: parsedTaxRate,
          globalReorderLevel: parsedReorderLevel,
        }),
      });

      const result = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(
          getResponseError(
            result,
            `Unable to save settings. Server returned ${response.status}.`,
          ),
        );
      }

      if (!result || typeof result !== "object") {
        throw new Error(
          "Settings may not have been saved because the server returned an invalid response.",
        );
      }

      const savedSettings = result as Partial<SystemSettings>;

      setBusinessName(
        typeof savedSettings.businessName === "string"
          ? savedSettings.businessName
          : cleanBusinessName,
      );

      setCurrency(
        typeof savedSettings.currency === "string"
          ? savedSettings.currency
          : currency,
      );

      setTaxRate(
        String(
          Number.isFinite(Number(savedSettings.taxRate))
            ? Number(savedSettings.taxRate)
            : parsedTaxRate,
        ),
      );

      setGlobalReorderLevel(
        String(
          Number.isFinite(
            Number(savedSettings.globalReorderLevel),
          )
            ? Number(savedSettings.globalReorderLevel)
            : parsedReorderLevel,
        ),
      );

      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="settings-view"
      className="space-y-6 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{`
        #settings-view .settings-readable {
          color: #0f172a !important;
        }

        #settings-view .settings-muted {
          color: #475569 !important;
        }

        #settings-view .settings-panel {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }

        #settings-view .settings-soft-panel {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        #settings-view .settings-control {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        #settings-view .settings-control::placeholder {
          color: #64748b !important;
          opacity: 1 !important;
        }

        html.dark #settings-view .settings-readable {
          color: #f8fafc !important;
        }

        html.dark #settings-view .settings-muted {
          color: #cbd5e1 !important;
        }

        html.dark #settings-view .settings-panel {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
        }

        html.dark #settings-view .settings-soft-panel {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }

        html.dark #settings-view .settings-control {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
          color: #ffffff !important;
        }

        html.dark #settings-view .settings-control::placeholder {
          color: #94a3b8 !important;
          opacity: 1 !important;
        }

        html.dark #settings-view option {
          background-color: #0f2236 !important;
          color: #ffffff !important;
        }
      `}</style>

      <section
        className="
          relative overflow-hidden rounded-[2rem]
          border border-amber-300 bg-white px-6 py-6
          shadow-[0_20px_60px_rgba(15,23,42,0.12)]
          dark:border-amber-300/20 dark:bg-[#081827]
          dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]
          sm:px-8 sm:py-7
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.09),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.13),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative flex items-start gap-4">
          <div
            className="
              grid h-14 w-14 shrink-0 place-items-center
              rounded-2xl border border-amber-300
              bg-amber-50 text-amber-800
              shadow-[0_12px_28px_rgba(180,123,24,0.16)]
              dark:border-amber-300/25
              dark:bg-amber-300/10 dark:text-amber-300
            "
          >
            <Settings className="h-7 w-7" />
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
              <SlidersHorizontal className="h-3.5 w-3.5" />
              System configuration
            </div>

            <h1 className="settings-readable mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-3xl">
              System & Business Settings
            </h1>

            <p className="settings-muted mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
              Manage the business profile, default currency, sales
              tax, and global low-stock threshold saved through the
              backend.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className={`${PANEL_CLASS} p-5 sm:p-7 xl:col-span-2`}>
          {loading ? (
            <div
              className="
                flex min-h-[280px] items-center justify-center
                rounded-2xl border border-slate-200 bg-slate-50
                dark:border-white/10 dark:bg-[#10263c]
              "
            >
              <div className="text-center">
                <RefreshCw className="mx-auto h-7 w-7 animate-spin text-amber-700 dark:text-amber-300" />

                <p className="settings-readable mt-4 text-sm font-extrabold text-slate-900 dark:text-white">
                  Loading settings...
                </p>

                <p className="settings-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Reading the saved values from the backend.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="border-b border-slate-200 pb-4 dark:border-white/10">
                <h2 className="settings-readable flex items-center gap-2 text-base font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  <Building2 className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  General Business Profile
                </h2>

                <p className="settings-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  These values are used as global defaults across the
                  system.
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Business Name / Institution
                </label>

                <input
                  type="text"
                  value={businessName}
                  onChange={(event) =>
                    setBusinessName(event.target.value)
                  }
                  className={INPUT_CLASS}
                  placeholder="Business Name"
                  required
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLASS}>
                    Default Currency Code
                  </label>

                  <select
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value)
                    }
                    className={INPUT_CLASS}
                    disabled={saving}
                  >
                    <option value="PKR">
                      PKR (Pakistani Rupee)
                    </option>
                    <option value="USD">
                      USD (US Dollar)
                    </option>
                    <option value="INR">
                      INR (Indian Rupee)
                    </option>
                    <option value="AED">
                      AED (UAE Dirham)
                    </option>
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Sales General Tax (%)
                  </label>

                  <input
                    type="number"
                    value={taxRate}
                    onChange={(event) =>
                      setTaxRate(event.target.value)
                    }
                    className={`${INPUT_CLASS} font-mono`}
                    min={0}
                    max={100}
                    step="0.01"
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4 pt-2 dark:border-white/10">
                <h2 className="settings-readable flex items-center gap-2 text-base font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  <CircleDollarSign className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                  Inventory Restocking Defaults
                </h2>

                <p className="settings-muted mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  This fallback is used when an individual book has no
                  custom reorder threshold.
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  Global Low Stock Reorder Level
                </label>

                <input
                  type="number"
                  value={globalReorderLevel}
                  onChange={(event) =>
                    setGlobalReorderLevel(event.target.value)
                  }
                  className={`${INPUT_CLASS} font-mono`}
                  min={1}
                  step={1}
                  disabled={saving}
                />

                <p className="settings-muted mt-2 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-400">
                  Stock alerts use this value only when a
                  book-specific reorder level is unavailable.
                </p>
              </div>

              {saved && (
                <div
                  className="
                    flex items-start gap-3 rounded-2xl
                    border border-emerald-200 bg-emerald-50
                    p-4 text-sm font-bold text-emerald-800
                    dark:border-emerald-400/20
                    dark:bg-emerald-400/10
                    dark:text-emerald-200
                  "
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>Settings saved successfully.</span>
                </div>
              )}

              {error && (
                <div
                  className="
                    flex items-start gap-3 rounded-2xl
                    border border-rose-200 bg-rose-50
                    p-4 text-sm font-bold leading-6
                    text-rose-800
                    dark:border-rose-400/20
                    dark:bg-rose-400/10 dark:text-rose-200
                  "
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end border-t border-slate-200 pt-5 dark:border-white/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="
                    inline-flex w-full items-center justify-center
                    gap-2 rounded-2xl border border-amber-400
                    bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
                    px-6 py-3.5 text-sm font-extrabold
                    text-slate-950
                    shadow-[0_14px_32px_rgba(180,123,24,0.24)]
                    transition hover:-translate-y-0.5
                    hover:brightness-105
                    disabled:cursor-not-allowed disabled:opacity-50
                    disabled:hover:translate-y-0
                    dark:border-amber-300/40
                    dark:text-[#081827]
                    sm:w-auto
                  "
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  <span>
                    {saving ? "Saving..." : "Save Settings"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-6">
          <section className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center rounded-2xl
                  border border-amber-300 bg-amber-50
                  text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-300
                "
              >
                <User className="h-5 w-5" />
              </div>

              <div>
                <h3 className="settings-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Operator Session
                </h3>

                <p className="settings-muted text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Current administrative context
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <InfoRow
                label="User Identity"
                value="Administrator"
              />

              <InfoRow
                label="Assigned Email"
                value="junaid@bookflow.com"
                mono
              />

              <InfoRow
                label="Workspace Scope"
                value="HQ General Manager"
              />
            </div>
          </section>

          <section className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
              <div
                className="
                  grid h-10 w-10 place-items-center rounded-2xl
                  border border-emerald-200 bg-emerald-50
                  text-emerald-700
                  dark:border-emerald-400/20
                  dark:bg-emerald-400/10 dark:text-emerald-300
                "
              >
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h3 className="settings-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Settings Persistence
                </h3>

                <p className="settings-muted text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Backend connection status
                </p>
              </div>
            </div>

            <p className="settings-muted mt-4 text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300">
              This page reads settings with <b>GET /api/settings</b>
              and saves them with <b>PUT /api/settings</b>.
            </p>

            <div
              className="
                mt-4 flex items-center gap-2 rounded-2xl
                border border-emerald-200 bg-emerald-50
                p-4 text-xs font-extrabold
                text-emerald-800
                dark:border-emerald-400/20
                dark:bg-emerald-400/10
                dark:text-emerald-200
              "
            >
              <Database className="h-4 w-4" />
              Settings persistence enabled
            </div>
          </section>

          <section className={`${PANEL_CLASS} p-5`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />

              <div>
                <h3 className="settings-readable text-sm font-extrabold text-slate-950 dark:text-[#f7ddb0]">
                  Important Scope
                </h3>

                <p className="settings-muted mt-2 text-xs font-semibold leading-6 text-slate-700 dark:text-slate-300">
                  Categories and publishers are not saved by this
                  Settings page. They require their own frontend forms
                  and backend routes such as <b>/api/categories</b> and
                  <b>/api/publishers</b>.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className={SOFT_PANEL_CLASS + " p-4"}>
      <span className="settings-muted block text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-slate-400">
        {label}
      </span>

      <p
        className={`settings-readable mt-1 break-words text-sm font-extrabold text-slate-950 dark:text-white ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}