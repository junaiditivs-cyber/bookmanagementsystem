import React, { useEffect, useState } from "react";
import { Settings, Save, CheckCircle2, RefreshCw, User, ShieldCheck, AlertCircle } from "lucide-react";
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

export default function SettingsView() {
  const [businessName, setBusinessName] = useState(defaultSettings.businessName);
  const [currency, setCurrency] = useState(defaultSettings.currency);
  const [taxRate, setTaxRate] = useState(String(defaultSettings.taxRate));
  const [globalReorderLevel, setGlobalReorderLevel] = useState(String(defaultSettings.globalReorderLevel));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiFetch("/api/settings");
        if (!res.ok) throw new Error("Unable to load settings.");
        const settings: SystemSettings = await res.json();
        setBusinessName(settings.businessName || defaultSettings.businessName);
        setCurrency(settings.currency || defaultSettings.currency);
        setTaxRate(String(settings.taxRate ?? defaultSettings.taxRate));
        setGlobalReorderLevel(String(settings.globalReorderLevel ?? defaultSettings.globalReorderLevel));
      } catch (err: any) {
        setError(err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await apiFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          currency,
          taxRate: Number(taxRate) || 0,
          globalReorderLevel: Number(globalReorderLevel) || defaultSettings.globalReorderLevel,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Unable to save settings.");

      setBusinessName(result.businessName);
      setCurrency(result.currency);
      setTaxRate(String(result.taxRate));
      setGlobalReorderLevel(String(result.globalReorderLevel));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="settings-view" className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      <div className="border-b border-slate-200/60 pb-5">
        <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-rose-500" />
          <span>System & Business Settings</span>
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
          Manage business profile, currency, tax, and reorder defaults. These settings now save through the backend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        <div className="lg:col-span-2 glass-panel border border-white/60 rounded-2xl p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">General Business Profile</h3>

              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Business Name / Institution</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none font-bold"
                  placeholder="Business Name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">Default Currency Code</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1.5">Sales General Tax (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none font-mono"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pt-4 pb-2">Automated Inventory Restocking Parameters</h3>

              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Global Low Stock Reorder Level</label>
                <input
                  type="number"
                  value={globalReorderLevel}
                  onChange={(e) => setGlobalReorderLevel(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-700 focus:outline-none font-mono"
                  min="1"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                  If book-specific reorder threshold is empty, this global fallback applies to stock alerts.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 flex-wrap gap-3">
                {saved && (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settings saved successfully!</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {!saved && !error && <div></div>}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 btn-premium-pink text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-white" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-panel border border-white/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-rose-500" />
              <span>Operator Session</span>
            </h3>
            <div className="space-y-2 text-slate-500 font-semibold">
              <p>User Identity: <span className="text-slate-800 font-extrabold">Administrator</span></p>
              <p>Assigned Email: <span className="text-slate-800 font-extrabold font-mono text-[11px]">junaid@bookflow.com</span></p>
              <p>Workspace Scope: <span className="text-slate-800 font-extrabold">HQ General Manager</span></p>
            </div>
          </div>

          <div className="glass-panel border border-white/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Database Integrity Checks</span>
            </h3>
            <p className="text-slate-500 leading-relaxed font-semibold">
              The system uses PostgreSQL/Supabase when available and safely falls back to local db.json for development.
            </p>
            <div className="mt-4 p-2 bg-slate-50 text-emerald-700 font-mono text-[10px] rounded-xl border border-slate-100 font-bold text-center">
              ● Settings persistence enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}