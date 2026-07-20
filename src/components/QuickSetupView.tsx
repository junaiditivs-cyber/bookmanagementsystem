import React from "react";
import {
  Building2,
  Users,
  Tags,
  BookOpen,
  Layers,
  Package,
  PlusCircle,
  Eye,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  FileText,
  Sparkles,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { DatabaseSchema } from "../types";

interface QuickSetupViewProps {
  data: DatabaseSchema;
  onNavigate: (page: string) => void;
  onOpenAddBook: () => void;
  onOpenAddStock: () => void;
  onOpenAddSale: () => void;
}

type StockBalanceLike = {
  quantity?: number;
  current_quantity?: number;
  currentQty?: number;
};

type ExtraData = DatabaseSchema & {
  stock_entries?: unknown[];
  customer_returns?: unknown[];
  publisher_returns?: unknown[];
  stock_transfers?: unknown[];
};

export default function QuickSetupView({
  data,
  onNavigate,
  onOpenAddBook,
  onOpenAddStock,
  onOpenAddSale,
}: QuickSetupViewProps) {
  const db = data as ExtraData;

  const locationsCount = data.locations?.length || 0;
  const publishersCount = data.publishers?.length || 0;
  const categoriesCount = data.categories?.length || 0;
  const subjectsCount = data.subjects?.length || 0;
  const classesCount = data.classes?.length || 0;
  const booksCount = data.books?.length || 0;
  const salesCount = data.sales?.length || 0;
  const stockEntriesCount = db.stock_entries?.length || 0;
  const customerReturnsCount = db.customer_returns?.length || 0;
  const publisherReturnsCount = db.publisher_returns?.length || 0;
  const transfersCount = db.stock_transfers?.length || 0;

  const totalStockQty = (data.stock_balances || []).reduce((sum, item) => {
    const balance = item as StockBalanceLike;
    return sum + Number(balance.quantity ?? balance.current_quantity ?? balance.currentQty ?? 0);
  }, 0);

  const setupChecks = [
    {
      label: "Warehouse added",
      done: locationsCount > 0,
    },
    {
      label: "Publisher added",
      done: publishersCount > 0,
    },
    {
      label: "Subject added",
      done: subjectsCount > 0,
    },
    {
      label: "Book added",
      done: booksCount > 0,
    },
    {
      label: "Stock added",
      done: totalStockQty > 0,
    },
    {
      label: "Ready for sale",
      done: booksCount > 0 && totalStockQty > 0,
    },
  ];

  const completedChecks = setupChecks.filter((item) => item.done).length;
  const progressPercent = Math.round((completedChecks / setupChecks.length) * 100);

  const isSystemEmpty =
    locationsCount === 0 &&
    publishersCount === 0 &&
    subjectsCount === 0 &&
    booksCount === 0 &&
    totalStockQty === 0;

  const hasBooksButNoStock = booksCount > 0 && totalStockQty === 0;
  const isReadyForSale = booksCount > 0 && totalStockQty > 0;

  const steps = [
    {
      step: "1",
      title: "Add Warehouse / Location",
      description:
        "Create your warehouse, shop, or school location before adding stock.",
      icon: Building2,
      countLabel: `${locationsCount} location${locationsCount === 1 ? "" : "s"} added`,
      actionLabel: "Add Location",
      viewLabel: "View Locations",
      onAction: () => onNavigate("locations"),
      onView: () => onNavigate("locations"),
      isCompleted: locationsCount > 0,
    },
    {
      step: "2",
      title: "Add Publisher",
      description:
        "Add the publishers from whom you buy or receive books.",
      icon: Users,
      countLabel: `${publishersCount} publisher${publishersCount === 1 ? "" : "s"} added`,
      actionLabel: "Add Publisher",
      viewLabel: "View Publishers",
      onAction: () => onNavigate("publishers"),
      onView: () => onNavigate("publishers"),
      isCompleted: publishersCount > 0,
    },
    {
      step: "3",
      title: "Add Subject",
      description:
        "Add subjects like Physics, Urdu, English, Mathematics, Science, and Computer.",
      icon: Bookmark,
      countLabel: `${subjectsCount} subject${subjectsCount === 1 ? "" : "s"} added`,
      actionLabel: "Add Subject",
      viewLabel: "View Subjects",
      onAction: () => onNavigate("subjects"),
      onView: () => onNavigate("subjects"),
      isCompleted: subjectsCount > 0,
    },
    {
      step: "4",
      title: "Add Category",
      description:
        "Create categories like Textbook, Workbook, Guide, Teacher Book, or Stationery.",
      icon: Tags,
      countLabel: `${categoriesCount} categor${categoriesCount === 1 ? "y" : "ies"} added`,
      actionLabel: "Manage Categories",
      viewLabel: "View Categories",
      onAction: () => onNavigate("advanced"),
      onView: () => onNavigate("advanced"),
      isCompleted: categoriesCount > 0,
    },
    {
      step: "5",
      title: "Add Class",
      description:
        "Create classes or grades like Nursery, Class 1, Class 6, Class 8, or Class 10.",
      icon: Layers,
      countLabel: `${classesCount} class${classesCount === 1 ? "" : "es"} added`,
      actionLabel: "Manage Classes",
      viewLabel: "View Classes",
      onAction: () => onNavigate("advanced"),
      onView: () => onNavigate("advanced"),
      isCompleted: classesCount > 0,
    },
    {
      step: "6",
      title: "Add Book",
      description:
        "Add book title, publisher, subject, class, purchase cost, sale price, and reorder level.",
      icon: BookOpen,
      countLabel: `${booksCount} book${booksCount === 1 ? "" : "s"} added`,
      actionLabel: "Add Book",
      viewLabel: "View Books",
      onAction: onOpenAddBook,
      onView: () => onNavigate("books"),
      isCompleted: booksCount > 0,
    },
    {
      step: "7",
      title: "Add Opening Stock",
      description:
        "Add the first stock quantity for books so they can appear in stock list and sales.",
      icon: Package,
      countLabel: `${totalStockQty} total unit${totalStockQty === 1 ? "" : "s"} in stock`,
      actionLabel: "Add Stock",
      viewLabel: "View Stock",
      onAction: onOpenAddStock,
      onView: () => onNavigate("stocklist"),
      isCompleted: totalStockQty > 0,
    },
    {
      step: "8",
      title: "View Stock List",
      description:
        "Check which books are available, low stock, or out of stock across all locations.",
      icon: Eye,
      countLabel: booksCount > 0 ? `${booksCount} book${booksCount === 1 ? "" : "s"} ready to check` : "No books yet",
      actionLabel: "Open Stock List",
      viewLabel: "Check Stock",
      onAction: () => onNavigate("stocklist"),
      onView: () => onNavigate("stocklist"),
      isCompleted: booksCount > 0 && totalStockQty > 0,
    },
    {
      step: "9",
      title: "Start Sale",
      description:
        "Sell books from a selected warehouse, shop, or school location and reduce stock automatically.",
      icon: TrendingUp,
      countLabel: `${salesCount} sale${salesCount === 1 ? "" : "s"} recorded`,
      actionLabel: "New Sale",
      viewLabel: "View Sales",
      onAction: onOpenAddSale,
      onView: () => onNavigate("sales"),
      isCompleted: salesCount > 0,
    },
    {
      step: "10",
      title: "View Monthly Records",
      description:
        "Review monthly stock entries, sales, returns, transfers, and closing stock.",
      icon: FileText,
      countLabel: `${stockEntriesCount} stock entr${stockEntriesCount === 1 ? "y" : "ies"} saved`,
      actionLabel: "Monthly Records",
      viewLabel: "Open Reports",
      onAction: () => onNavigate("monthly-records"),
      onView: () => onNavigate("reports"),
      isCompleted: stockEntriesCount > 0 || salesCount > 0,
    },
  ];

  return (
    <div id="quick-setup-view" className="space-y-8 animate-fadeIn">
      {/* PROFESSIONAL WELCOME BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100/70 bg-white/75 p-6 shadow-xl shadow-blue-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.10),transparent_40%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                Start Here
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                  isReadyForSale
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                    : hasBooksButNoStock
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                }`}
              >
                {isReadyForSale ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ready for Sales
                  </>
                ) : hasBooksButNoStock ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Stock Missing
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-3.5 w-3.5" />
                    Setup Progress {progressPercent}%
                  </>
                )}
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Welcome to Junaid Books Management System
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              Set up your publishers, warehouses, subjects, books, and stock in a simple
              step-by-step flow. Once stock is added, you can start sales, returns,
              transfers, and monthly reporting.
            </p>

            {isSystemEmpty && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm font-semibold text-blue-800 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                No setup data found yet. Start by adding your first warehouse, publisher,
                subject, and book.
              </div>
            )}

            {hasBooksButNoStock && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                Books are added, but stock is missing. Add opening stock to start selling.
              </div>
            )}

            {isReadyForSale && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                Your system is ready for sales. You can now sell books and track monthly records.
              </div>
            )}
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg shadow-slate-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Setup Progress
              </span>
              <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300">
                {progressPercent}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {setupChecks.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  <span>{item.label}</span>
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* REAL SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard label="Publishers" value={publishersCount} />
        <SummaryCard label="Subjects" value={subjectsCount} />
        <SummaryCard label="Books" value={booksCount} />
        <SummaryCard label="Stock Units" value={totalStockQty} />
        <SummaryCard label="Sales" value={salesCount} />
      </div>

      {/* SETUP CARDS GRID */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <div
              key={step.step}
              className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                step.isCompleted
                  ? "border-emerald-200/80 bg-white/80 shadow-emerald-900/[0.04] dark:border-emerald-400/20 dark:bg-slate-950/55"
                  : "border-slate-200/80 bg-white/70 shadow-slate-900/[0.04] dark:border-white/10 dark:bg-slate-950/45"
              }`}
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-fuchsia-500/10 blur-3xl" />
              </div>

              <div className="relative">
                <div className="mb-5 flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm ${
                      step.isCompleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {step.isCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {step.step}
                    </span>
                  )}
                </div>

                <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {step.title}
                </h3>

                <p className="mt-2 min-h-[54px] text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
              </div>

              <div className="relative mt-6 border-t border-slate-200/70 pt-5 dark:border-white/10">
                <div className="mb-4 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    Real Count
                  </span>
                  <span
                    className={`text-right font-extrabold ${
                      step.isCompleted
                        ? "text-emerald-600 dark:text-emerald-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {step.countLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    id={`setup-act-${step.step}`}
                    onClick={step.onAction}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-xs font-extrabold shadow-sm transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                      step.isCompleted
                        ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
                        : "bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-600 text-white shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25"
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>{step.isCompleted ? "Add More" : step.actionLabel}</span>
                  </button>

                  <button
                    id={`setup-view-${step.step}`}
                    onClick={step.onView}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-extrabold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-blue-400/10 dark:hover:text-blue-200"
                  >
                    <span>{step.viewLabel}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECORD SNAPSHOT */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold text-slate-950 dark:text-white">
              Current System Snapshot
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              These numbers are coming from your saved records, not mock data.
            </p>
          </div>

          <button
            onClick={() => onNavigate("reports")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            <FileText className="h-4 w-4" />
            Open Reports
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SnapshotItem label="Stock Entries" value={stockEntriesCount} />
          <SnapshotItem label="Customer Returns" value={customerReturnsCount} />
          <SnapshotItem label="Publisher Returns" value={publisherReturnsCount} />
          <SnapshotItem label="Transfers" value={transfersCount} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 shadow-lg shadow-slate-900/[0.03] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-extrabold text-slate-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function SnapshotItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}