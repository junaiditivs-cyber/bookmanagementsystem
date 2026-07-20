import React, { useMemo } from "react";
import {
  BookOpen,
  Users,
  Building2,
  Package,
  Layers,
  AlertTriangle,
  ShoppingCart,
  RotateCcw,
  TrendingUp,
  DollarSign,
  Calendar,
  Plus,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileText,
  BarChart3,
  Eye,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DatabaseSchema, Book } from "../types";

interface DashboardViewProps {
  data: DatabaseSchema;
  onNavigate: (page: string) => void;
  onTriggerAddStock: (bookId: string) => void;
}

type SaleLike = {
  id: string;
  date?: string;
  sale_date?: string;
  created_at?: string;
};

type SaleItemLike = {
  sale_id: string;
  quantity?: number;
  line_total?: number;
  total?: number;
  unit_price?: number;
};

type StockEntryLike = {
  id?: string;
  date?: string;
  entry_date?: string;
  created_at?: string;
  book_id?: string;
  location_id?: string;
  quantity?: number;
  unit_cost?: number;
};

type ReturnLike = {
  id?: string;
  date?: string;
  return_date?: string;
  created_at?: string;
  book_id?: string;
  quantity?: number;
};

type PublisherReturnLike = ReturnLike;

type BalanceLike = {
  book_id: string;
  location_id?: string;
  quantity?: number;
  current_quantity?: number;
  currentQty?: number;
};

type ExtendedData = DatabaseSchema & {
  sale_items?: SaleItemLike[];
  stock_entries?: StockEntryLike[];
  customer_returns?: ReturnLike[];
  publisher_returns?: PublisherReturnLike[];
};

const money = (value: number) => `PKR ${Math.round(value || 0).toLocaleString()}`;
const number = (value: number) => Math.round(value || 0).toLocaleString();

function getDateValue(record: { date?: string; sale_date?: string; entry_date?: string; return_date?: string; created_at?: string }) {
  return record.date || record.sale_date || record.entry_date || record.return_date || record.created_at || "";
}

function isToday(dateValue: string, today: string) {
  return dateValue.slice(0, 10) === today;
}

function isSameMonth(dateValue: string, month: string) {
  return dateValue.slice(0, 7) === month;
}

function getLastSixMonths() {
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });
  const months: { key: string; name: string }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: date.toISOString().slice(0, 7),
      name: formatter.format(date),
    });
  }

  return months;
}

export default function DashboardView({ data, onNavigate, onTriggerAddStock }: DashboardViewProps) {
    const db = data as ExtendedData;
  const balances = (data.stock_balances || []) as BalanceLike[];
  const sales = (data.sales || []) as SaleLike[];
  const saleItems = db.sale_items || [];
  const stockEntries = db.stock_entries || [];
  const customerReturns = db.customer_returns || [];
  const publisherReturns = db.publisher_returns || [];

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentMonthStr = todayStr.slice(0, 7);

  const stockByBookId = useMemo(() => {
    const map = new Map<string, number>();

    for (const balance of balances) {
      const quantity = Number(balance.quantity ?? balance.current_quantity ?? balance.currentQty ?? 0);
      map.set(balance.book_id, (map.get(balance.book_id) || 0) + quantity);
    }

    return map;
  }, [balances]);

  const saleDateById = useMemo(() => {
    const map = new Map<string, string>();

    for (const sale of sales) {
      map.set(sale.id, getDateValue(sale));
    }

    return map;
  }, [sales]);

  const bookTitleById = useMemo(() => {
    const map = new Map<string, string>();

    for (const book of data.books) {
      map.set(book.id, book.title);
    }

    return map;
  }, [data.books]);

  const saleSummaryBySaleId = useMemo(() => {
    const map = new Map<string, { amount: number; qty: number }>();

    for (const item of saleItems) {
      const current = map.get(item.sale_id) || { amount: 0, qty: 0 };

      current.amount += Number((item as any).line_total ?? (item as any).total ?? 0);
      current.qty += Number(item.quantity || 0);

      map.set(item.sale_id, current);
    }

    return map;
  }, [saleItems]);

  const getBookTotalStock = (book: Book) => stockByBookId.get(book.id) || 0;

  const {
    totalRegisteredBooks,
    totalPublishers,
    totalLocations,
    totalSubjects,
    totalStockCopies,
    totalInventoryCostValue,
    totalPotentialSaleValue,
    availableBooksList,
    lowStockBooksList,
    outOfStockBooksList,
    todaySalesAmount,
    todaySoldQty,
    thisMonthSalesAmount,
    thisMonthSoldQty,
    todayStockAddedQty,
    thisMonthStockAddedQty,
    todayCustomerReturnsQty,
    thisMonthCustomerReturnsQty,
    thisMonthPublisherReturnsQty,
    monthlySalesData,
    bookBreakdownChartData,
    recentStockEntries,
    recentSales,
  } = useMemo(() => {
    const availableBooks: Book[] = [];
    const lowStockBooks: Book[] = [];
    const outOfStockBooks: Book[] = [];

    let inventoryCostValue = 0;
    let potentialSaleValue = 0;

    for (const book of data.books) {
      const stock = stockByBookId.get(book.id) || 0;
      const reorderLevel = Number(book.reorder_level || 0);

      inventoryCostValue += stock * Number(book.purchase_cost || 0);
      potentialSaleValue += stock * Number(book.sale_price || 0);

      if (stock === 0) {
        outOfStockBooks.push(book);
      } else if (stock <= reorderLevel) {
        lowStockBooks.push(book);
      } else {
        availableBooks.push(book);
      }
    }

    let salesTodayAmount = 0;
    let salesTodayQty = 0;
    let salesThisMonthAmount = 0;
    let salesThisMonthQty = 0;

    const monthRows = getLastSixMonths().map((month) => ({
      name: month.name,
      key: month.key,
      sales: 0,
      stockIn: 0,
    }));

    const monthRowByKey = new Map(monthRows.map((row) => [row.key, row]));

    for (const item of saleItems) {
      const dateValue = saleDateById.get(item.sale_id) || "";
      const amount = Number((item as any).line_total ?? (item as any).total ?? 0);
      const qty = Number(item.quantity || 0);

      if (isToday(dateValue, todayStr)) {
        salesTodayAmount += amount;
        salesTodayQty += qty;
      }

      if (isSameMonth(dateValue, currentMonthStr)) {
        salesThisMonthAmount += amount;
        salesThisMonthQty += qty;
      }

      const monthRow = monthRowByKey.get(dateValue.slice(0, 7));

      if (monthRow) {
        monthRow.sales += amount;
      }
    }

    let stockAddedTodayQty = 0;
    let stockAddedThisMonthQty = 0;

    for (const entry of stockEntries) {
      const dateValue = getDateValue(entry);
      const qty = Number(entry.quantity || 0);

      if (isToday(dateValue, todayStr)) {
        stockAddedTodayQty += qty;
      }

      if (isSameMonth(dateValue, currentMonthStr)) {
        stockAddedThisMonthQty += qty;
      }

      const monthRow = monthRowByKey.get(dateValue.slice(0, 7));

      if (monthRow) {
        monthRow.stockIn += qty;
      }
    }

    let customerReturnsTodayQty = 0;
    let customerReturnsThisMonthQty = 0;

    for (const entry of customerReturns) {
      const dateValue = getDateValue(entry);
      const qty = Number(entry.quantity || 0);

      if (isToday(dateValue, todayStr)) {
        customerReturnsTodayQty += qty;
      }

      if (isSameMonth(dateValue, currentMonthStr)) {
        customerReturnsThisMonthQty += qty;
      }
    }

    let publisherReturnsThisMonthQty = 0;

    for (const entry of publisherReturns) {
      const dateValue = getDateValue(entry);

      if (isSameMonth(dateValue, currentMonthStr)) {
        publisherReturnsThisMonthQty += Number(entry.quantity || 0);
      }
    }

    const recentStock = [...stockEntries]
      .sort((a, b) => getDateValue(b).localeCompare(getDateValue(a)))
      .slice(0, 5);

    const recentSaleRows = [...sales]
      .sort((a, b) => getDateValue(b).localeCompare(getDateValue(a)))
      .slice(0, 5);

    return {
      totalRegisteredBooks: data.books.length,
      totalPublishers: data.publishers.length,
      totalLocations: data.locations.length,
      totalSubjects: data.subjects?.length || 0,
      totalStockCopies: balances.reduce((sum, balance) => {
        return sum + Number(balance.quantity ?? balance.current_quantity ?? balance.currentQty ?? 0);
      }, 0),
      totalInventoryCostValue: inventoryCostValue,
      totalPotentialSaleValue: potentialSaleValue,
      availableBooksList: availableBooks,
      lowStockBooksList: lowStockBooks,
      outOfStockBooksList: outOfStockBooks,
      todaySalesAmount: salesTodayAmount,
      todaySoldQty: salesTodayQty,
      thisMonthSalesAmount: salesThisMonthAmount,
      thisMonthSoldQty: salesThisMonthQty,
      todayStockAddedQty: stockAddedTodayQty,
      thisMonthStockAddedQty: stockAddedThisMonthQty,
      todayCustomerReturnsQty: customerReturnsTodayQty,
      thisMonthCustomerReturnsQty: customerReturnsThisMonthQty,
      thisMonthPublisherReturnsQty: publisherReturnsThisMonthQty,
      monthlySalesData: monthRows.map(({ key, ...row }) => row),
      bookBreakdownChartData: [
        { name: "Available", value: availableBooks.length, color: "#2563eb" },
        { name: "Low Stock", value: lowStockBooks.length, color: "#f59e0b" },
        { name: "Out of Stock", value: outOfStockBooks.length, color: "#f43f5e" },
      ],
      recentStockEntries: recentStock,
      recentSales: recentSaleRows,
    };
  }, [
    balances,
    currentMonthStr,
    customerReturns,
    data.books,
    data.locations.length,
    data.publishers.length,
    data.subjects,
    publisherReturns,
    saleDateById,
    saleItems,
    sales,
    stockByBookId,
    stockEntries,
    todayStr,
  ]);

  const getBookTitle = (bookId?: string) => {
    if (!bookId) return "Unknown Book";

    return bookTitleById.get(bookId) || "Unknown Book";
  };

  return (
    <div id="dashboard-view" className="space-y-8 animate-fadeIn">
      {/* PREMIUM HEADER */}
      <div className="relative overflow-hidden rounded-[2rem] border border-blue-100/70 bg-white/75 p-6 shadow-xl shadow-blue-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.10),transparent_40%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                <Sparkles className="h-3.5 w-3.5" /> Live Dashboard
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Real saved records
              </span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Business Control Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
              View real stock, sales, returns, publisher records, low-stock alerts, and monthly movement from your saved data.
            </p>
          </div>

                    <div className="grid grid-cols-2 gap-3 sm:min-w-[340px]">
            <QuickAction label="Add Stock" icon={Package} onClick={() => onNavigate("addstock")} />
            <QuickAction label="Stock List" icon={Eye} onClick={() => onNavigate("stocklist")} />
            <QuickAction label="Books" icon={BookOpen} onClick={() => onNavigate("books")} />
            <QuickAction label="Grade Sets" icon={Layers} onClick={() => onNavigate("gradesets")} />
          </div>
        </div>
      </div>

      {/* COMPACT PREMIUM AYAT-UL-KURSI FEATURE */}
      <section
        aria-labelledby="ayat-ul-kursi-title"
        className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.09)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-[#0d1828] sm:p-5 lg:p-6"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.12),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(245,158,11,0.10),transparent_32%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(59,130,246,0.16),transparent_34%),radial-gradient(circle_at_100%_100%,rgba(245,158,11,0.07),transparent_30%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(30deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%), linear-gradient(150deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%)",
            backgroundPosition: "0 0, 0 0",
            backgroundSize: "44px 76px",
            color: "#2563eb",
          }}
        />

        <div className="relative grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-stretch">
          <div className="relative overflow-hidden rounded-[1.65rem] border border-blue-200/70 bg-gradient-to-br from-[#0f2b57] via-[#173b73] to-[#1d4f8c] px-5 py-6 text-white shadow-[0_16px_36px_rgba(30,64,175,0.22)] dark:border-blue-300/15 dark:from-[#10233f] dark:via-[#16315a] dark:to-[#1b4072] sm:px-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-16 -left-14 h-40 w-40 rounded-full bg-amber-300/10 blur-2xl" />

            <div className="relative flex h-full flex-col justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-blue-50 backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  Daily Quranic Reminder
                </div>

                <div className="mt-5 flex items-center gap-4 xl:block">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-amber-200/30 bg-white/10 shadow-inner backdrop-blur xl:h-16 xl:w-16">
                    <BookOpen className="h-7 w-7 text-amber-200" />
                  </div>

                  <div className="xl:mt-5">
                    <h2
                      id="ayat-ul-kursi-title"
                      dir="rtl"
                      className="text-2xl font-black tracking-wide text-white sm:text-3xl"
                      style={{
                        fontFamily:
                          '"Noto Naskh Arabic", "Traditional Arabic", "Segoe UI", serif',
                      }}
                    >
                      آيَةُ الْكُرْسِيِّ
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-blue-100/85">
                      Surah Al-Baqarah · 2:255
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-amber-200/25 bg-amber-300/10 px-3 py-1 text-[10px] font-extrabold text-amber-100">
                  سورۃ البقرۃ
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-extrabold text-blue-50">
                  آیت 255
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-extrabold text-emerald-100">
                  <CheckCircle2 className="h-3 w-3" />
                  Complete Verse
                </span>
              </div>
            </div>
          </div>

          <div className="relative flex min-w-0 items-center overflow-hidden rounded-[1.65rem] border border-amber-200/80 bg-[#fffdf8] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-slate-600/70 dark:bg-[#18263a] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-7 sm:py-7 lg:px-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(245,158,11,0.10),transparent_28%),radial-gradient(circle_at_88%_92%,rgba(37,99,235,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_12%_8%,rgba(245,158,11,0.07),transparent_28%),radial-gradient(circle_at_88%_92%,rgba(59,130,246,0.14),transparent_32%)]" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/65 to-transparent dark:via-amber-300/35" />
            <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent dark:via-blue-300/30" />
            <span className="pointer-events-none absolute left-4 top-4 text-4xl font-serif text-amber-500/20 dark:text-amber-300/20">
              ﴾
            </span>
            <span className="pointer-events-none absolute bottom-4 right-4 text-4xl font-serif text-amber-500/20 dark:text-amber-300/20">
              ﴿
            </span>

            <p
              dir="rtl"
              lang="ar"
              className="relative mx-auto w-full text-center font-bold text-[#14213a] dark:text-[#f8fafc]"
              style={{
                fontFamily:
                  '"Noto Naskh Arabic", "Traditional Arabic", "Segoe UI", serif',
                fontSize: "clamp(1.12rem, 1.45vw, 1.52rem)",
                lineHeight: 2.05,
              }}
            >
              اللّٰهُ لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَؤُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ
            </p>
          </div>
        </div>
      </section>

      {/* GRADE SETS SHORTCUT */}
      <button
        type="button"
        onClick={() => onNavigate("gradesets")}
        className="group w-full overflow-hidden rounded-[2rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-blue-50 p-6 text-left shadow-xl shadow-slate-900/[0.04] transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-2xl"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-rose-100 bg-white p-4 text-rose-500 shadow-sm">
              <Layers className="h-7 w-7" />
            </div>

            <div>
              <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.22em] text-rose-500">
                Grade Wise Set System
              </p>

              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-950">
                View Complete Book Sets by Grade
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Open the grade set page to see Grade 1 to Grade 10 cards, complete sets available,
                limiting books, location-wise stock, and remaining books after sets.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-rose-500/20">
            <Eye className="h-4 w-4" />
            Open Grade Sets
          </div>
        </div>
      </button>

      {/* PRIMARY STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Books"
          value={number(totalRegisteredBooks)}
          helper="Registered book titles"
          icon={BookOpen}
          tone="blue"
        />
        <StatCard
          title="Available Stock"
          value={number(totalStockCopies)}
          helper="Current total copies"
          icon={Package}
          tone="emerald"
        />
        <StatCard
          title="Stock Value"
          value={money(totalInventoryCostValue)}
          helper="Based on purchase cost"
          icon={DollarSign}
          tone="indigo"
        />
        <StatCard
          title="Potential Sale Value"
          value={money(totalPotentialSaleValue)}
          helper="Based on sale price"
          icon={TrendingUp}
          tone="purple"
        />
      </div>

      {/* SECONDARY BUSINESS METRICS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniMetric
          label="Publishers"
          value={number(totalPublishers)}
          icon={Users}
          onClick={() => onNavigate("publishers")}
        />
        <MiniMetric
          label="Warehouses"
          value={number(totalLocations)}
          icon={Building2}
          onClick={() => onNavigate("locations")}
        />
        <MiniMetric
          label="Subjects"
          value={number(totalSubjects)}
          icon={Layers}
          onClick={() => onNavigate("subjects")}
        />
        <MiniMetric
          label="Sales Today"
          value={money(todaySalesAmount)}
          icon={ShoppingCart}
          onClick={() => onNavigate("sales")}
        />
      </div>

      {/* MONTHLY / TODAY METRICS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MovementCard
          title="This Month Sales"
          value={money(thisMonthSalesAmount)}
          helper={`${number(thisMonthSoldQty)} books sold`}
          icon={TrendingUp}
          trend="up"
        />
        <MovementCard
          title="This Month Stock Added"
          value={`+${number(thisMonthStockAddedQty)}`}
          helper={`${number(todayStockAddedQty)} units added today`}
          icon={Package}
          trend="up"
        />
        <MovementCard
          title="Customer Returns"
          value={`+${number(thisMonthCustomerReturnsQty)}`}
          helper={`${number(todayCustomerReturnsQty)} returned today`}
          icon={RotateCcw}
          trend="neutral"
        />
        <MovementCard
          title="Returns to Publisher"
          value={`-${number(thisMonthPublisherReturnsQty)}`}
          helper="This month returned stock"
          icon={ArrowDownRight}
          trend="down"
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 xl:col-span-2">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-lg font-extrabold text-slate-950 dark:text-white">
                Monthly Sales & Stock In
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Last six months calculated from saved sales and stock entries.
              </p>
            </div>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
              Real data
            </span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    borderColor: "rgba(226,232,240,0.9)",
                    borderRadius: "18px",
                    boxShadow: "0 20px 40px rgba(15,23,42,0.10)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales Amount"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#2563eb", strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="stockIn"
                  name="Stock Added"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#a855f7", strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
          <div className="mb-3">
            <h3 className="font-display text-lg font-extrabold text-slate-950 dark:text-white">
              Book Stock Status
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Available, low stock, and out-of-stock titles.
            </p>
          </div>

          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookBreakdownChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {bookBreakdownChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <LegendItem color="bg-blue-600" label="Available" value={availableBooksList.length} />
            <LegendItem color="bg-amber-500" label="Low Stock" value={lowStockBooksList.length} />
            <LegendItem color="bg-rose-500" label="Out of Stock" value={outOfStockBooksList.length} />
          </div>
        </div>
      </div>

      {/* ALERTS AND RECENT ACTIVITY */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AlertList
          title="Low Stock Warnings"
          description="Books at or below reorder level."
          books={lowStockBooksList}
          getBookTotalStock={getBookTotalStock}
          tone="amber"
          emptyText="No low stock warnings currently active."
          onTriggerAddStock={onTriggerAddStock}
        />

        <AlertList
          title="Out of Stock Alerts"
          description="Books with zero available copies."
          books={outOfStockBooksList}
          getBookTotalStock={getBookTotalStock}
          tone="rose"
          emptyText="No completely depleted titles detected."
          onTriggerAddStock={onTriggerAddStock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentPanel
          title="Recent Stock Entries"
          emptyText="No stock entries saved yet. Use Smart Entry or Add Stock."
          actionLabel="Add Stock"
          onAction={() => onNavigate("addstock")}
        >
          {recentStockEntries.map((entry) => (
            <ActivityRow
              key={entry.id || `${entry.book_id}-${getDateValue(entry)}`}
              title={getBookTitle(entry.book_id)}
              subtitle={`${getDateValue(entry).slice(0, 10) || "No date"} • Qty ${number(Number(entry.quantity || 0))}`}
              value={money(Number(entry.quantity || 0) * Number(entry.unit_cost || 0))}
            />
          ))}
        </RecentPanel>

        <RecentPanel
          title="Recent Sales"
          emptyText="No sales saved yet. Create your first sale from Sales page."
          actionLabel="New Sale"
          onAction={() => onNavigate("sales")}
        >
                 {recentSales.map((sale) => {
            const summary = saleSummaryBySaleId.get(sale.id) || { amount: 0, qty: 0 };

            return (
              <ActivityRow
                key={sale.id}
                title={`Sale ${sale.id.slice(-6).toUpperCase()}`}
                subtitle={`${getDateValue(sale).slice(0, 10) || "No date"} • ${number(summary.qty)} books sold`}
                value={money(summary.amount)}
              />
            );
          })}
        </RecentPanel>
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-extrabold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-blue-400/10 dark:hover:text-blue-200"
    >
      <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
      {label}
    </button>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone: "blue" | "emerald" | "indigo" | "purple";
}) {
  const toneClasses = {
    blue: "from-blue-600 to-cyan-500 text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-400/10 dark:border-blue-400/20 dark:text-blue-300",
    emerald: "from-emerald-600 to-teal-500 text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-400/10 dark:border-emerald-400/20 dark:text-emerald-300",
    indigo: "from-indigo-600 to-blue-500 text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-400/10 dark:border-indigo-400/20 dark:text-indigo-300",
    purple: "from-fuchsia-600 to-purple-500 text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-400/10 dark:border-fuchsia-400/20 dark:text-fuchsia-300",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/75 p-5 shadow-xl shadow-slate-900/[0.04] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-white/10 dark:bg-slate-950/55">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneClasses.split(" ").slice(0, 2).join(" ")}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            {title}
          </p>
          <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {helper}
          </p>
        </div>
        <div className={`rounded-2xl border p-3 ${toneClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, icon: Icon, onClick }: { label: string; value: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-[1.5rem] border border-slate-200/80 bg-white/70 p-4 text-left shadow-lg shadow-slate-900/[0.03] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70 dark:border-white/10 dark:bg-slate-950/45 dark:hover:bg-blue-400/10"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-2 text-xl font-extrabold text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function MovementCard({
  title,
  value,
  helper,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}) {
  const TrendIcon = trend === "down" ? ArrowDownRight : trend === "up" ? ArrowUpRight : RotateCcw;
  const color = trend === "down" ? "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-400/10 dark:border-rose-400/20 dark:text-rose-300" : trend === "up" ? "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-400/10 dark:border-emerald-400/20 dark:text-emerald-300" : "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-400/10 dark:border-amber-400/20 dark:text-amber-300";

  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/75 p-5 shadow-lg shadow-slate-900/[0.03] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/50">
      <div className="flex items-start justify-between">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className={`rounded-full border px-2.5 py-1 ${color}`}>
          <TrendIcon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-extrabold text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}

function AlertList({
  title,
  description,
  books,
  getBookTotalStock,
  tone,
  emptyText,
  onTriggerAddStock,
}: {
  title: string;
  description: string;
  books: Book[];
  getBookTotalStock: (book: Book) => number;
  tone: "amber" | "rose";
  emptyText: string;
  onTriggerAddStock: (bookId: string) => void;
}) {
  const toneClass = tone === "rose" ? "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-400/10 dark:border-rose-400/20 dark:text-rose-300" : "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-400/10 dark:border-amber-400/20 dark:text-amber-300";

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-white/10">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-slate-950 dark:text-white">
            <AlertTriangle className={`h-5 w-5 ${tone === "rose" ? "text-rose-500" : "text-amber-500"}`} />
            {title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${toneClass}`}>{books.length}</span>
      </div>

      <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
        {books.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {emptyText}
          </div>
        ) : (
          books.map((book) => {
            const stock = getBookTotalStock(book);
            return (
              <div key={book.id} className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-blue-400/10">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{book.title}</h4>
                  <p className="mt-1 text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">
                    Code: {book.book_number} • Reorder: {book.reorder_level}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-2xl border px-3 py-1 text-xs font-extrabold ${toneClass}`}>{stock} left</span>
                  <button
                    onClick={() => onTriggerAddStock(book.id)}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-2 text-white shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                    title="Add Stock"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RecentPanel({
  title,
  emptyText,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  emptyText: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 shadow-xl shadow-slate-900/[0.04] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-white/10">
        <div>
          <h3 className="font-display text-lg font-extrabold text-slate-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Latest saved records</p>
        </div>
        <button
          onClick={onAction}
          className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold text-blue-700 transition-all hover:bg-blue-100 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
        >
          {actionLabel}
        </button>
      </div>

      <div className="space-y-3">
        {hasChildren ? (
          children
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-sm font-semibold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ title, subtitle, value }: { title: string; subtitle: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}