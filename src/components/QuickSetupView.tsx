import React from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bookmark,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Layers,
  Package,
  PlusCircle,
  Sparkles,
  Tags,
  TrendingUp,
  Users,
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

const PANEL_CLASS =
  "quick-panel rounded-[2rem] border border-slate-300 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.12)] dark:border-amber-300/20 dark:bg-[#081827] dark:shadow-[0_26px_78px_rgba(0,0,0,0.44)]";

const SOFT_PANEL_CLASS =
  "quick-soft-panel rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#10263c]";

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

  const totalStockQty = (data.stock_balances || []).reduce(
    (sum, item) => {
      const balance = item as StockBalanceLike;

      return (
        sum +
        Number(
          balance.quantity ??
            balance.current_quantity ??
            balance.currentQty ??
            0,
        )
      );
    },
    0,
  );

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

  const completedChecks = setupChecks.filter(
    (item) => item.done,
  ).length;

  const progressPercent = Math.round(
    (completedChecks / setupChecks.length) * 100,
  );

  const isSystemEmpty =
    locationsCount === 0 &&
    publishersCount === 0 &&
    subjectsCount === 0 &&
    booksCount === 0 &&
    totalStockQty === 0;

  const hasBooksButNoStock =
    booksCount > 0 && totalStockQty === 0;

  const isReadyForSale =
    booksCount > 0 && totalStockQty > 0;

  const steps = [
    {
      step: "1",
      title: "Add Warehouse / Location",
      description:
        "Create your warehouse, shop, or school location before adding stock.",
      icon: Building2,
      countLabel: `${locationsCount} location${
        locationsCount === 1 ? "" : "s"
      } added`,
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
      countLabel: `${publishersCount} publisher${
        publishersCount === 1 ? "" : "s"
      } added`,
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
      countLabel: `${subjectsCount} subject${
        subjectsCount === 1 ? "" : "s"
      } added`,
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
      countLabel: `${categoriesCount} categor${
        categoriesCount === 1 ? "y" : "ies"
      } added`,
      actionLabel: "Manage Categories",
      viewLabel: "View Categories",
      onAction: () => onNavigate("categories"),
      onView: () => onNavigate("categories"),
      isCompleted: categoriesCount > 0,
    },
    {
      step: "5",
      title: "Add Class",
      description:
        "Create classes or grades like Nursery, Class 1, Class 6, Class 8, or Class 10.",
      icon: Layers,
      countLabel: `${classesCount} class${
        classesCount === 1 ? "" : "es"
      } added`,
      actionLabel: "Manage Classes",
      viewLabel: "View Classes",
      onAction: () => onNavigate("gradesets"),
      onView: () => onNavigate("gradesets"),
      isCompleted: classesCount > 0,
    },
    {
      step: "6",
      title: "Add Book",
      description:
        "Add book title, publisher, subject, class, purchase cost, sale price, and reorder level.",
      icon: BookOpen,
      countLabel: `${booksCount} book${
        booksCount === 1 ? "" : "s"
      } added`,
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
      countLabel: `${totalStockQty} total unit${
        totalStockQty === 1 ? "" : "s"
      } in stock`,
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
      countLabel:
        booksCount > 0
          ? `${booksCount} book${
              booksCount === 1 ? "" : "s"
            } ready to check`
          : "No books yet",
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
      countLabel: `${salesCount} sale${
        salesCount === 1 ? "" : "s"
      } recorded`,
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
      countLabel: `${stockEntriesCount} stock entr${
        stockEntriesCount === 1 ? "y" : "ies"
      } saved`,
      actionLabel: "Monthly Records",
      viewLabel: "Open Reports",
      onAction: () => onNavigate("monthly-records"),
      onView: () => onNavigate("reports"),
      isCompleted:
        stockEntriesCount > 0 || salesCount > 0,
    },
  ];

  return (
    <div
      id="quick-setup-view"
      className="space-y-8 pb-12 text-slate-950 animate-fadeIn dark:text-slate-100"
    >
      <style>{`
        #quick-setup-view .quick-readable {
          color: #0f172a !important;
        }

        #quick-setup-view .quick-muted {
          color: #475569 !important;
        }

        #quick-setup-view .quick-panel {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }

        #quick-setup-view .quick-soft-panel {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }

        html.dark #quick-setup-view .quick-readable {
          color: #f8fafc !important;
        }

        html.dark #quick-setup-view .quick-muted {
          color: #cbd5e1 !important;
        }

        html.dark #quick-setup-view .quick-panel {
          background-color: #081827 !important;
          border-color: rgba(252, 211, 77, 0.22) !important;
        }

        html.dark #quick-setup-view .quick-soft-panel {
          background-color: #10263c !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }
      `}</style>

      <section
        className="
          relative overflow-hidden rounded-[2rem]
          border border-amber-300 bg-white px-6 py-7
          shadow-[0_20px_60px_rgba(15,23,42,0.12)]
          dark:border-amber-300/20 dark:bg-[#081827]
          dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]
          sm:px-8 sm:py-8
        "
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.09),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.13),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-amber-300 bg-amber-50 px-3 py-1
                  text-[10px] font-black uppercase
                  tracking-[0.2em] text-amber-800
                  dark:border-amber-300/25
                  dark:bg-amber-300/10 dark:text-amber-200
                "
              >
                <Sparkles className="h-3.5 w-3.5" />
                Start Here
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                  isReadyForSale
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                    : hasBooksButNoStock
                      ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                      : "border-slate-300 bg-slate-100 text-slate-700 dark:border-white/15 dark:bg-[#10263c] dark:text-slate-200"
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

            <h1 className="quick-readable font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0] sm:text-4xl">
              Welcome to Junaid Books Management System
            </h1>

            <p className="quick-muted mt-3 text-sm font-semibold leading-7 text-slate-700 dark:text-slate-300 sm:text-base">
              Set up your publishers, warehouses, subjects, books,
              and stock in a simple step-by-step flow. Once stock is
              added, you can start sales, returns, transfers, and
              monthly reporting.
            </p>

            {isSystemEmpty && (
              <div
                className="
                  mt-5 rounded-2xl border border-blue-200
                  bg-blue-50 p-4 text-sm font-bold
                  leading-6 text-blue-900
                  dark:border-blue-400/20
                  dark:bg-blue-400/10 dark:text-blue-100
                "
              >
                No setup data found yet. Start by adding your first
                warehouse, publisher, subject, and book.
              </div>
            )}

            {hasBooksButNoStock && (
              <div
                className="
                  mt-5 rounded-2xl border border-amber-200
                  bg-amber-50 p-4 text-sm font-bold
                  leading-6 text-amber-900
                  dark:border-amber-400/20
                  dark:bg-amber-400/10
                  dark:text-amber-100
                "
              >
                Books are added, but stock is missing. Add opening
                stock to start selling.
              </div>
            )}

            {isReadyForSale && (
              <div
                className="
                  mt-5 rounded-2xl border border-emerald-200
                  bg-emerald-50 p-4 text-sm font-bold
                  leading-6 text-emerald-900
                  dark:border-emerald-400/20
                  dark:bg-emerald-400/10
                  dark:text-emerald-100
                "
              >
                Your system is ready for sales. You can now sell
                books and track monthly records.
              </div>
            )}
          </div>

          <div
            className={`
              ${PANEL_CLASS}
              w-full shrink-0 p-5 xl:max-w-sm
            `}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="quick-muted text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                Setup Progress
              </span>

              <span className="font-mono text-base font-extrabold text-amber-800 dark:text-amber-300">
                {progressPercent}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-[#10263c]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#8a5a11_0%,#c58a26_55%,#f0c667_100%)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {setupChecks.map((item) => (
                <div
                  key={item.label}
                  className={`${SOFT_PANEL_CLASS} flex items-center justify-between gap-3 px-3 py-2.5`}
                >
                  <span className="quick-readable text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {item.label}
                  </span>

                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  ) : (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryCard
          label="Publishers"
          value={publishersCount}
        />
        <SummaryCard
          label="Subjects"
          value={subjectsCount}
        />
        <SummaryCard label="Books" value={booksCount} />
        <SummaryCard
          label="Stock Units"
          value={totalStockQty}
        />
        <SummaryCard label="Sales" value={salesCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <article
              key={step.step}
              className={`
                quick-panel group relative flex h-full
                flex-col justify-between overflow-hidden
                rounded-[2rem] border bg-white p-6
                shadow-[0_18px_48px_rgba(15,23,42,0.10)]
                transition duration-300 hover:-translate-y-1
                hover:border-amber-400
                hover:shadow-[0_25px_68px_rgba(180,123,24,0.16)]
                dark:bg-[#081827]
                dark:hover:border-amber-300/35
                ${
                  step.isCompleted
                    ? "border-emerald-300 dark:border-emerald-400/25"
                    : "border-slate-300 dark:border-amber-300/20"
                }
              `}
            >
              <div className="pointer-events-none absolute -right-14 -top-14 h-32 w-32 rounded-full border border-amber-300/15" />

              <div className="relative">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                      step.isCompleted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-300"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {step.isCompleted ? (
                    <span
                      className="
                        inline-flex items-center gap-1 rounded-full
                        border border-emerald-200 bg-emerald-50
                        px-2.5 py-1 text-[10px] font-extrabold
                        uppercase tracking-wide text-emerald-800
                        dark:border-emerald-400/20
                        dark:bg-emerald-400/10
                        dark:text-emerald-200
                      "
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </span>
                  ) : (
                    <span
                      className="
                        grid h-8 w-8 place-items-center rounded-full
                        border border-slate-300 bg-slate-100
                        text-xs font-extrabold text-slate-700
                        dark:border-white/15 dark:bg-[#10263c]
                        dark:text-slate-200
                      "
                    >
                      {step.step}
                    </span>
                  )}
                </div>

                <h3 className="quick-readable font-display text-base font-extrabold tracking-tight text-slate-950 dark:text-[#f7ddb0]">
                  {step.title}
                </h3>

                <p className="quick-muted mt-2 min-h-[72px] text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </div>

              <div className="relative mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
                <div className="mb-4 flex items-start justify-between gap-3 text-xs">
                  <span className="quick-muted shrink-0 font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
                    Real Count
                  </span>

                  <span
                    className={`text-right font-extrabold ${
                      step.isCompleted
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {step.countLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    id={`setup-act-${step.step}`}
                    type="button"
                    onClick={step.onAction}
                    className={`
                      inline-flex min-h-12 items-center
                      justify-center gap-2 rounded-2xl px-4 py-3
                      text-xs font-extrabold shadow-sm
                      transition hover:-translate-y-0.5
                      ${
                        step.isCompleted
                          ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200"
                          : "border border-amber-400 bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)] text-slate-950 shadow-[0_12px_28px_rgba(180,123,24,0.22)] dark:border-amber-300/40 dark:text-[#081827]"
                      }
                    `}
                  >
                    <PlusCircle className="h-4 w-4 shrink-0" />

                    <span>
                      {step.isCompleted
                        ? "Add More"
                        : step.actionLabel}
                    </span>
                  </button>

                  <button
                    id={`setup-view-${step.step}`}
                    type="button"
                    onClick={step.onView}
                    className="
                      inline-flex min-h-12 items-center
                      justify-center gap-2 rounded-2xl
                      border border-slate-300 bg-white
                      px-4 py-3 text-xs font-extrabold
                      text-slate-800 shadow-sm transition
                      hover:-translate-y-0.5
                      hover:border-amber-400 hover:bg-amber-50
                      hover:text-amber-900
                      dark:border-white/15 dark:bg-[#10263c]
                      dark:text-slate-100
                      dark:hover:border-amber-300/30
                      dark:hover:bg-amber-300/10
                      dark:hover:text-amber-200
                    "
                  >
                    <span>{step.viewLabel}</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className={`${PANEL_CLASS} p-6`}>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="quick-readable font-display text-xl font-extrabold text-slate-950 dark:text-[#f7ddb0]">
              Current System Snapshot
            </h2>

            <p className="quick-muted mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
              These numbers are coming from your saved records, not
              mock data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("reports")}
            className="
              inline-flex items-center justify-center gap-2
              rounded-2xl border border-amber-400
              bg-[linear-gradient(135deg,#8a5a11_0%,#c58a26_50%,#f0c667_100%)]
              px-5 py-3 text-sm font-extrabold
              text-slate-950
              shadow-[0_12px_28px_rgba(180,123,24,0.22)]
              transition hover:-translate-y-0.5
              hover:brightness-105
              dark:border-amber-300/40
              dark:text-[#081827]
            "
          >
            <FileText className="h-4 w-4" />
            Open Reports
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SnapshotItem
            label="Stock Entries"
            value={stockEntriesCount}
          />

          <SnapshotItem
            label="Customer Returns"
            value={customerReturnsCount}
          />

          <SnapshotItem
            label="Publisher Returns"
            value={publisherReturnsCount}
          />

          <SnapshotItem
            label="Transfers"
            value={transfersCount}
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className={PANEL_CLASS + " p-5"}>
      <p className="quick-muted text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
        {label}
      </p>

      <p className="quick-readable mt-2 font-mono text-3xl font-extrabold text-slate-950 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function SnapshotItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className={SOFT_PANEL_CLASS + " p-4"}>
      <p className="quick-muted text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">
        {label}
      </p>

      <p className="quick-readable mt-2 font-mono text-2xl font-extrabold text-slate-950 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}