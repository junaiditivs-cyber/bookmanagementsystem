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
  Tags,
  Search,
  LibraryBig,
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
const CategoriesView = React.lazy(() => import("./components/CategoriesView"));

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
  const [preSelectedReturnMode, setPreSelectedReturnMode] = useState<"customer" | "publisher">("customer");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [navigationQuery, setNavigationQuery] = useState("");
  const [isNavigationSearchOpen, setIsNavigationSearchOpen] = useState(false);

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
    categories: "inventory.manage",
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
    setIsNavigationSearchOpen(false);

    if (page !== "addstock" && page !== "sales" && page !== "returns") {
      setPreSelectedBookId(undefined);
    }
    if (page === "returns") {
      setPreSelectedReturnMode("customer");
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

  const handleTriggerReturn = (bookId: string, mode: "customer" | "publisher") => {
    if (!hasPermission("returns.manage")) {
      showNotification("You do not have permission to process returns.", "error");
      return;
    }

    setPreSelectedBookId(bookId);
    setPreSelectedReturnMode(mode);
    setCurrentPage("returns");
    setIsMobileSidebarOpen(false);
  };

  if (loading || !data) {
    return <LoadingScreen />;
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp, section: "Overview" },
    { id: "quick-setup", label: "Quick Setup", icon: Sparkles, section: "Overview" },
    { id: "books", label: "Books", icon: BookOpen, section: "Inventory" },
    { id: "addstock", label: "Stock In", icon: Package, section: "Inventory" },
    { id: "stocklist", label: "Stock List", icon: Eye, section: "Inventory" },
    { id: "gradesets", label: "Grade Sets", icon: Layers, section: "Inventory" },
    { id: "subjects", label: "Subjects", icon: Bookmark, section: "Inventory" },
    { id: "categories", label: "Categories", icon: Tags, section: "Inventory" },
    { id: "sales", label: "Sales", icon: ShoppingCart, section: "Operations" },
    { id: "returns", label: "Returns", icon: RotateCcw, section: "Operations" },
    { id: "transfers", label: "Stock Transfers", icon: ArrowRightLeft, section: "Operations" },
    { id: "damage-loss", label: "Damage & Loss", icon: ShieldAlert, section: "Operations" },
    { id: "publishers", label: "Publishers", icon: Users, section: "Partners" },
    { id: "locations", label: "Warehouses", icon: Building2, section: "Partners" },
    { id: "reports", label: "Reports", icon: FileText, section: "Reports" },
    { id: "monthly-records", label: "Monthly Records", icon: CalendarDays, section: "Reports" },
    { id: "publisher-stock", label: "Publisher Stock", icon: BarChart3, section: "Reports" },
    { id: "subject-stock", label: "Subject Stock", icon: BarChart3, section: "Reports" },
    { id: "settings", label: "Settings", icon: Settings, section: "Administration" },
    { id: "users", label: "User Management", icon: UserCog, section: "Administration" },
  ].filter((item) => allowedPages.has(item.id));

  const sidebarSections = ["Overview", "Inventory", "Operations", "Partners", "Reports", "Administration"]
    .map((section) => ({
      section,
      items: sidebarItems.filter((item) => item.section === section),
    }))
    .filter((group) => group.items.length > 0);

  const roleLabel = user?.role
    ? user.role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
    : "User";

  const currentPageLabel = sidebarItems.find((item) => item.id === currentPage)?.label || "Dashboard";
  const normalizedNavigationQuery = navigationQuery.trim().toLowerCase();
  const navigationSearchResults = sidebarItems
    .filter((item) =>
      normalizedNavigationQuery
        ? `${item.label} ${item.section}`.toLowerCase().includes(normalizedNavigationQuery)
        : true,
    )
    .slice(0, 8);

  const handleNavigationSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = navigationQuery.trim().toLowerCase();
    if (!query) return;

    const match = sidebarItems.find((item) =>
      `${item.label} ${item.section}`.toLowerCase().includes(query),
    );

    if (!match) {
      showNotification("No matching page found.", "error");
      return;
    }

    navigateToPage(match.id);
    setNavigationQuery("");
    setIsNavigationSearchOpen(false);
  };

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
          className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`final-classic-sidebar final-classic-sidebar-collapsed fixed inset-y-0 left-0 z-50 select-none no-print transition-transform duration-300 ease-out lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="final-sidebar-shell">
          <div className="final-sidebar-brand">
            <button
              type="button"
              onClick={() => setShowLogoPreview(true)}
              className="final-sidebar-logo"
              aria-label="Open IVS Books Management logo"
            >
              <LibraryBig className="final-sidebar-logo-fallback" />
              <img
                src="/ivs-logo.png"
                alt=""
                className="final-sidebar-logo-image"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </button>

            <div className="min-w-0 flex-1">
              <p className="final-sidebar-brand-title">IVS Books</p>
              <p className="final-sidebar-brand-subtitle">Management</p>
              <span className="final-sidebar-brand-badge">Stock &amp; Sales</span>
            </div>

          </div>

          <nav className="final-sidebar-nav premium-scroll" aria-label="Primary navigation">
            {sidebarSections.map((group) => (
              <section key={group.section} className="final-sidebar-section">
                <div className="final-sidebar-section-title">
                  <span>{group.section}</span>
                  <i aria-hidden="true" />
                </div>

                <div className="final-sidebar-items">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateToPage(item.id)}
                        className={`final-sidebar-item ${isActive ? "final-sidebar-item-active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="final-sidebar-item-icon">
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="final-sidebar-item-label">{item.label}</span>
                        <span className="final-sidebar-item-glow" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>

          <div className="final-sidebar-footer">
            <div className="final-sidebar-footer-logo">
              <img src="/ivs-logo.png" alt="" />
            </div>
            <div className="min-w-0 flex-1">
              <p>IVS Books Management</p>
              <span>Version 2.0.0</span>
            </div>
            <span className="final-sidebar-online" title="Database synced" />
          </div>
        </div>
      </aside>

      <main className="final-app-main final-app-main-collapsed flex min-h-screen min-w-0 flex-1 flex-col bg-transparent">
        <header className="sticky top-0 z-30 px-3 pt-3 no-print sm:px-5 lg:px-6">
          <div className="final-classic-navbar">
            <div className="final-navbar-workspace">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="final-navbar-menu lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <span className="final-navbar-workspace-icon">
                <LibraryBig className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <p>Active Workspace</p>
                <strong>IVS Books Management</strong>
                <span>{currentPageLabel}</span>
              </div>
            </div>

            <div className="final-navbar-actions">
              <div className="final-navbar-search-control">
                <button
                  type="button"
                  onClick={() => setIsNavigationSearchOpen((value) => !value)}
                  className={`final-navbar-icon-button ${isNavigationSearchOpen ? "is-active" : ""}`}
                  title="Search pages"
                  aria-label="Search pages"
                  aria-expanded={isNavigationSearchOpen}
                >
                  <Search className="h-4 w-4" />
                </button>

                {isNavigationSearchOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setIsNavigationSearchOpen(false)}
                      aria-label="Close search"
                    />
                    <form className="final-navbar-search-popover" onSubmit={handleNavigationSearch}>
                      <div className="final-search-popover-head">
                        <div>
                          <p>Search workspace</p>
                          <span>Open any page without using the sidebar</span>
                        </div>
                        <kbd>Esc</kbd>
                      </div>

                      <label className="final-search-input-wrap">
                        <Search className="h-5 w-5" aria-hidden="true" />
                        <input
                          autoFocus
                          value={navigationQuery}
                          onChange={(event) => setNavigationQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setIsNavigationSearchOpen(false);
                          }}
                          placeholder="Search pages, stock, reports..."
                          aria-label="Search navigation pages"
                        />
                        <kbd>Enter</kbd>
                      </label>

                      <div className="final-search-results" aria-label="Search results">
                        {navigationSearchResults.length > 0 ? (
                          navigationSearchResults.map((item) => {
                            const ResultIcon = item.icon;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                className="final-search-result"
                                onClick={() => {
                                  navigateToPage(item.id);
                                  setNavigationQuery("");
                                  setIsNavigationSearchOpen(false);
                                }}
                              >
                                <span className="final-search-result-icon">
                                  <ResultIcon className="h-4 w-4" />
                                </span>
                                <span className="final-search-result-copy">
                                  <strong>{item.label}</strong>
                                  <small>{item.section}</small>
                                </span>
                                <span className="final-search-result-arrow" aria-hidden="true">→</span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="final-search-empty">No matching page found.</div>
                        )}
                      </div>

                      <div className="final-search-popover-foot">
                        <span>Click a result or press Enter to open the first match.</span>
                      </div>
                    </form>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="final-navbar-icon-button"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((value) => !value)}
                  className="final-navbar-user"
                  aria-expanded={showUserMenu}
                >
                  <span className="final-navbar-avatar">{user?.name?.slice(0, 1).toUpperCase()}</span>
                  <span className="hidden min-w-0 text-left sm:block">
                    <strong>{user?.name}</strong>
                    <small>{roleLabel}</small>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {showUserMenu && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowUserMenu(false)}
                      aria-label="Close account menu"
                    />
                    <div className="final-navbar-user-menu">
                      <div className="final-navbar-user-menu-head">
                        <div className="final-navbar-user-menu-avatar">
                          {user?.name?.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p>{user?.name}</p>
                          <span>{user?.email}</span>
                        </div>
                      </div>
                      <div className="final-navbar-role">
                        <ShieldCheck className="h-3.5 w-3.5" /> {roleLabel}
                      </div>
                      <div className="final-navbar-user-menu-actions">
                        <button
                          type="button"
                          onClick={() => { setShowUserMenu(false); setShowChangePassword(true); }}
                        >
                          <KeyRound className="h-4 w-4" /> Change Password
                        </button>
                        {hasPermission("users.manage") && (
                          <button
                            type="button"
                            onClick={() => { setShowUserMenu(false); navigateToPage("users"); }}
                          >
                            <UserCog className="h-4 w-4" /> User Management
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void logout()}
                          className="final-navbar-signout"
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

        <div className="mx-auto w-full max-w-[1660px] flex-1 overflow-x-hidden px-3 pb-8 pt-5 sm:px-5 lg:px-6 lg:pt-6">
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
                preSelectedReturnMode={preSelectedReturnMode}
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
                onTriggerCustomerReturn={(bookId) => handleTriggerReturn(bookId, "customer")}
                onTriggerPublisherReturn={(bookId) => handleTriggerReturn(bookId, "publisher")}
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

            {currentPage === "categories" && (
              <CategoriesView
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