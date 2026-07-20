/// <reference types="react" />
import React, { Suspense, useEffect, useLayoutEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Building2,
  BookOpen,
  Package,
  Eye,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  X,
  Settings,
  Sun,
  Moon,
  Menu,
  Layers,
  UserCog,
  LogOut,
  KeyRound,
  ChevronDown,
  ShieldCheck,
  RotateCcw,
  ArrowRightLeft,
  ShieldAlert,
  Sparkles,
  FileText,
  CalendarDays,
  BarChart3,
  Bookmark,
} from "lucide-react";
import { DatabaseSchema } from "./types";
import { useAuth } from "./auth/AuthContext";
import { apiFetch } from "./api/http";
import ChangePasswordView from "./components/ChangePasswordView";

const DashboardView = React.lazy(() => import("./components/DashboardView"));
const PublishersView = React.lazy(() => import("./components/PublishersView"));
const LocationsView = React.lazy(() => import("./components/LocationsView"));
const BooksView = React.lazy(() => import("./components/BooksView"));
const AddStockView = React.lazy(() => import("./components/AddStockView"));
const StockListView = React.lazy(() => import("./components/StockListView"));
const SalesView = React.lazy(() => import("./components/SalesView"));
const GradeSetsView = React.lazy(() => import("./components/GradeSetsView"));
const SettingsView = React.lazy(() => import("./components/SettingsView"));
const UserManagementView = React.lazy(() => import("./components/UserManagementView"));
const ReturnsView = React.lazy(() => import("./components/ReturnsView"));
const TransfersView = React.lazy(() => import("./components/TransfersView"));
const DamageLossView = React.lazy(() => import("./components/DamageLossView"));

const SubjectsView = React.lazy(() => import("./components/SubjectsView"));

const ReportsView = React.lazy(() => import("./components/ReportsView"));
const MonthlyRecordsView = React.lazy(() => import("./components/MonthlyRecordsView"));

const PublisherWiseStockView = React.lazy(() => import("./components/PublisherWiseStockView"));
const SubjectWiseStockView = React.lazy(() => import("./components/SubjectWiseStockView"));
const QuickSetupView = React.lazy(() => import("./components/QuickSetupView"));

function LoadingScreen() {
  return (
    <div className="min-h-screen premium-app-bg flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/70 p-2 shadow-[0_20px_60px_rgba(79,70,229,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-fuchsia-500/15" />
          <img
            src="/ivs-logo.png"
            alt="IVS Book Management Logo"
            className="relative z-10 h-full w-full object-contain"
          />
        </div>
        <div className="absolute -inset-3 rounded-[2rem] border border-blue-500/20"></div>
      </div>

      <div className="text-center">
        <p className="text-sm font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
          IVS Book Management
        </p>
        <p className="mt-1 text-[11px] font-mono tracking-[0.28em] text-slate-400 uppercase">
          Loading workspace...
        </p>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="rounded-3xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] p-8 text-center shadow-soft">
      <div className="mx-auto mb-4 h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-500 shadow-premium-glow flex items-center justify-center">
        <BookOpen className="h-5 w-5 text-white" />
      </div>

      <p className="text-sm font-display font-extrabold tracking-tight text-slate-900 dark:text-white">
        Loading page...
      </p>

      <p className="mt-1 text-[11px] font-mono tracking-[0.2em] text-slate-400 uppercase">
        Please wait
      </p>
    </div>
  );
}

export default function App() {
  const { user, logout, hasPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>("dashboard");
  const [data, setData] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const [preSelectedBookId, setPreSelectedBookId] = useState<string | undefined>(undefined);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const getInitialTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";

    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  };

  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  const applyTheme = (selectedTheme: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.toggle("dark", selectedTheme === "dark");
    root.classList.toggle("light", selectedTheme === "light");
    root.setAttribute("data-theme", selectedTheme);
    root.style.colorScheme = selectedTheme;
    localStorage.setItem("theme", selectedTheme);
  };

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => root.classList.remove("theme-switching"));
    });
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadDatabase = async () => {
    try {
      const res = await apiFetch("/api/data");
      if (!res.ok) throw new Error("Failed to fetch store database.");

      const db = await res.json();
      setData(db);
    } catch (err) {
      console.error(err);
      showNotification("Failed to load records from local system.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  const pagePermissions: Record<string, string> = {
    dashboard: "data.read",
    "quick-setup": "inventory.manage",
    books: "inventory.manage",
    addstock: "stock.manage",
    sales: "sales.manage",
    returns: "returns.manage",
    transfers: "transfers.manage",
    "damage-loss": "damage.manage",
    stocklist: "data.read",
    gradesets: "inventory.manage",
    subjects: "inventory.manage",
    publishers: "inventory.manage",
    locations: "inventory.manage",
    reports: "data.read",
    "monthly-records": "data.read",
    "publisher-stock": "data.read",
    "subject-stock": "data.read",
    settings: "settings.manage",
    users: "users.manage",
  };

  const allowedPages = new Set(
    Object.entries(pagePermissions)
      .filter(([, permission]) => hasPermission(permission))
      .map(([page]) => page),
  );

  const navigateToPage = (page: string) => {
    if (!allowedPages.has(page)) {
      showNotification("You do not have permission to access this page.", "error");
      return;
    }

    setCurrentPage(page);
    setIsMobileSidebarOpen(false);

    if (page !== "addstock" && page !== "sales" && page !== "returns") {
      setPreSelectedBookId(undefined);
    }
  };

  const handleTriggerAddStock = (bookId: string) => {
    if (!hasPermission("stock.manage")) {
      showNotification("You do not have permission to add stock.", "error");
      return;
    }

    setPreSelectedBookId(bookId);
    setCurrentPage("addstock");
    setIsMobileSidebarOpen(false);
  };

  const handleTriggerSell = (bookId: string) => {
    if (!hasPermission("sales.manage")) {
      showNotification("You do not have permission to create sales.", "error");
      return;
    }

    setPreSelectedBookId(bookId);
    setCurrentPage("sales");
    setIsMobileSidebarOpen(false);
  };

  const handleTriggerReturn = () => {
    if (!hasPermission("returns.manage")) {
      showNotification("You do not have permission to process returns.", "error");
      return;
    }

    setPreSelectedBookId(undefined);
    setCurrentPage("returns");
    setIsMobileSidebarOpen(false);
  };

  if (loading || !data) {
    return <LoadingScreen />;
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "quick-setup", label: "Quick Setup", icon: Sparkles },
    { id: "books", label: "Books", icon: BookOpen },
    { id: "addstock", label: "Stock In", icon: Package },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "returns", label: "Returns", icon: RotateCcw },
    { id: "transfers", label: "Stock Transfers", icon: ArrowRightLeft },
    { id: "damage-loss", label: "Damage & Loss", icon: ShieldAlert },
    { id: "stocklist", label: "Stock List", icon: Eye },
    { id: "gradesets", label: "Grade Sets", icon: Layers },
    { id: "subjects", label: "Subjects", icon: Bookmark },
    { id: "publishers", label: "Publishers", icon: Users },
    { id: "locations", label: "Warehouses", icon: Building2 },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "monthly-records", label: "Monthly Records", icon: CalendarDays },
    { id: "publisher-stock", label: "Publisher Stock", icon: BarChart3 },
    { id: "subject-stock", label: "Subject Stock", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "users", label: "User Management", icon: UserCog },
  ].filter((item) => allowedPages.has(item.id));

  const roleLabel = user?.role
    ? user.role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
    : "User";

  return (
    <div
      data-theme={theme}
      className="min-h-screen premium-app-bg flex overflow-x-hidden font-sans antialiased text-slate-800 dark:text-slate-100"
    >
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[282px] premium-sidebar flex flex-col justify-between select-none no-print transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="border-b border-white/60 p-4 dark:border-white/10">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-300/30 bg-gradient-to-br from-[#0B1F4D] via-[#312E81] to-[#701A75] px-4 py-4 shadow-[0_22px_55px_rgba(30,41,120,0.38)]">
              <div className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-cyan-400/25 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-14 -right-8 h-32 w-32 rounded-full bg-fuchsia-400/25 blur-2xl" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.14] via-transparent to-white/[0.04]" />

              <div className="relative z-10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoPreview(true)}
                  title="Click to enlarge logo"
                  className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-white/15 p-1.5 shadow-[0_14px_34px_rgba(56,189,248,0.32)] backdrop-blur-xl transition hover:scale-[1.04] hover:border-white/50 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                >
                  <BookOpen className="absolute h-8 w-8 text-white/90" />
                  <img
                    src="/ivs-logo.png"
                    alt="IVS Book Management Logo"
                    className="relative z-10 h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.28)]"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                  <span className="pointer-events-none absolute inset-x-2 bottom-1.5 z-20 rounded-full bg-slate-950/70 px-2 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.14em] text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                    View Logo
                  </span>
                </button>

                <div className="min-w-0">
                  
                  <h1 className="mt-1 text-[18px] font-display font-extrabold leading-[1.05] tracking-tight !text-white">
                    <span className="block !text-white">IVS Books</span>
                    <span className="block !text-white">Management</span>
                  </h1>

                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 backdrop-blur-xl">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.95)]" />
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.17em] !text-white">
                      Stock & Sales
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <nav className="py-4 px-3 space-y-1 overflow-y-auto max-h-[72vh] premium-scroll">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => navigateToPage(item.id)}
                  className={`premium-nav-item ${isActive ? "premium-nav-item-active" : ""}`}
                >
                  <span className={`premium-nav-icon ${isActive ? "premium-nav-icon-active" : ""}`}>
                    <Icon className="w-4 h-4" />
                  </span>

                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/60 dark:border-white/10">
          <div className="rounded-3xl border border-white/70 dark:border-white/10 bg-white/50 dark:bg-white/[0.04] p-3 shadow-soft">
            <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300 font-mono font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_14px_rgba(16,185,129,0.8)]"></span>
              <span>Local Database Synced</span>
            </div>

            <p className="text-[9px] text-slate-400 mt-2">© 2026 IVS Book Management</p>

            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
              Simple Stock In / Sales System
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-transparent overflow-hidden">
        <header className="px-3 py-3 sm:px-5 lg:px-8 flex items-center justify-between no-print z-10">
          <div className="premium-topbar w-full flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-mono tracking-[0.18em] sm:tracking-[0.22em] uppercase text-blue-600 dark:text-blue-300 font-bold">
                  Active Workspace
                </p>

                <p className="truncate text-xs sm:text-sm text-slate-900 dark:text-white font-display font-extrabold">
                  IVS Books Management
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="premium-theme-toggle cursor-pointer"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                id="theme-toggle-button"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-600" />
                )}

                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((value) => !value)}
                  className="premium-pill cursor-pointer"
                  aria-expanded={showUserMenu}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-[10px] font-extrabold text-white">
                    {user?.name?.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[150px] truncate text-[10px] font-extrabold text-slate-800 dark:text-white">{user?.name}</span>
                    <span className="block text-[8px] uppercase tracking-[0.12em] text-slate-400">{roleLabel}</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowUserMenu(false)}
                      aria-label="Close account menu"
                    />
                    <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900">
                      <div className="border-b border-slate-200 p-4 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-extrabold text-white">
                            {user?.name?.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{user?.name}</p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">
                          <ShieldCheck className="h-3 w-3" /> {roleLabel}
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                        >
                          <KeyRound className="h-4 w-4 text-amber-500" /> Change Password
                        </button>
                        {hasPermission("users.manage") && (
                          <button
                            type="button"
                            onClick={() => { setShowUserMenu(false); navigateToPage("users"); }}
                            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                          >
                            <UserCog className="h-4 w-4 text-blue-500" /> User Management
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void logout()}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-400/10"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full max-w-[1480px] mx-auto overflow-y-auto overflow-x-hidden px-3 pb-6 pt-2 sm:px-5 sm:pb-8 lg:px-8 lg:pt-4 premium-scroll">
          <Suspense fallback={<PageLoading />}>
            {currentPage === "dashboard" && (
              <DashboardView
                data={data}
                onNavigate={(page) => navigateToPage(page)}
                onTriggerAddStock={handleTriggerAddStock}
              />
            )}

            {currentPage === "quick-setup" && (
              <QuickSetupView
                data={data}
                onNavigate={(page) => navigateToPage(page)}
                onOpenAddBook={() => navigateToPage("books")}
                onOpenAddStock={() => navigateToPage("addstock")}
                onOpenAddSale={() => navigateToPage("sales")}
              />
            )}

            {currentPage === "books" && (
              <BooksView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
              />
            )}

            

            {currentPage === "addstock" && (
              <AddStockView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
                preSelectedBookId={preSelectedBookId}
                onClearPreSelectedBookId={() => setPreSelectedBookId(undefined)}
              />
            )}

            {currentPage === "sales" && (
              <SalesView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
                preSelectedBookId={preSelectedBookId}
                onClearPreSelectedBookId={() => setPreSelectedBookId(undefined)}
              />
            )}

            {currentPage === "returns" && (
              <ReturnsView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
                preSelectedBookId={preSelectedBookId}
                onClearPreSelectedBookId={() => setPreSelectedBookId(undefined)}
              />
            )}

            {currentPage === "transfers" && (
              <TransfersView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
              />
            )}

            {currentPage === "damage-loss" && (
              <DamageLossView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
              />
            )}

            {currentPage === "stocklist" && (
              <StockListView
                data={data}
                onNavigate={(page) => navigateToPage(page)}
                onTriggerSell={handleTriggerSell}
                onTriggerCustomerReturn={handleTriggerReturn}
                onTriggerPublisherReturn={handleTriggerReturn}
                onTriggerAddStock={handleTriggerAddStock}
                canAddStock={hasPermission("stock.manage")}
                canSell={hasPermission("sales.manage")}
                canReturns={hasPermission("returns.manage")}
              />
            )}

            {currentPage === "gradesets" && (
              <GradeSetsView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
                onTriggerAddStock={handleTriggerAddStock}
              />
            )}

            {currentPage === "subjects" && (
              <SubjectsView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
              />
            )}

            {currentPage === "publishers" && (
              <PublishersView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
              />
            )}

            {currentPage === "locations" && (
              <LocationsView
                data={data}
                onRefresh={loadDatabase}
                onShowNotification={showNotification}
              />
            )}

            {currentPage === "reports" && <ReportsView data={data} />}

            {currentPage === "monthly-records" && <MonthlyRecordsView data={data} />}

            

            {currentPage === "publisher-stock" && <PublisherWiseStockView data={data} />}

            {currentPage === "subject-stock" && <SubjectWiseStockView data={data} />}

            

            {currentPage === "settings" && hasPermission("settings.manage") && <SettingsView />}

            {currentPage === "users" && hasPermission("users.manage") && <UserManagementView />}
          </Suspense>
        </div>
      </main>

      {showLogoPreview && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowLogoPreview(false);
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-[#0B1F4D] via-[#312E81] to-[#701A75] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
            <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-12 h-52 w-52 rounded-full bg-fuchsia-400/25 blur-3xl" />

            <button
              type="button"
              onClick={() => setShowLogoPreview(false)}
              aria-label="Close logo preview"
              className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10">
              <p className="text-center text-[9px] font-extrabold uppercase tracking-[0.24em] text-cyan-200">
                Official Project Logo
              </p>

              <div className="mx-auto mt-5 flex h-64 w-64 items-center justify-center overflow-hidden rounded-[2rem] border border-white/25 bg-white/12 p-4 shadow-[0_20px_55px_rgba(56,189,248,0.25)] backdrop-blur-xl">
                <BookOpen className="absolute h-16 w-16 text-white/80" />
                <img
                  src="/ivs-logo.png"
                  alt="IVS Book Management Logo"
                  className="relative z-10 h-full w-full object-contain drop-shadow-[0_16px_30px_rgba(0,0,0,0.35)]"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <h2 className="mt-5 text-center text-2xl font-display font-extrabold text-white">
                IVS Books Management
              </h2>
              <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">
                Stock & Sales System
              </p>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <ChangePasswordView onClose={() => setShowChangePassword(false)} />
      )}

      {notification && (
        <div className="fixed inset-x-3 bottom-4 z-50 animate-bounce sm:inset-x-auto sm:right-6 sm:bottom-6">
          <div
            className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-2xl glass-panel border flex items-center gap-3 text-xs font-semibold ${
              notification.type === "success"
                ? "border-emerald-200 text-emerald-700 bg-white/95 dark:border-emerald-400/20 dark:bg-slate-950/90 dark:text-emerald-200"
                : "border-rose-200 text-rose-700 bg-white/95 dark:border-rose-400/20 dark:bg-slate-950/90 dark:text-rose-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
            )}

            <span>{notification.message}</span>

            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}