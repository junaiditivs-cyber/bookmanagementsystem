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
        { name: "Available", value: availableBooks.length, color: "#d6a23f" },
        { name: "Low Stock", value: lowStockBooks.length, color: "#f0c36a" },
        { name: "Out of Stock", value: outOfStockBooks.length, color: "#d85b5b" },
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
   <div
  id="dashboard-view"
  className="professional-dual-dashboard w-full max-w-none space-y-8 animate-fadeIn"
>
      {/* PREMIUM HEADER */}
      <div className="dashboard-hero relative overflow-hidden rounded-[1.35rem] border p-6 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/20 backdrop-blur-xl dark:border-amber-500/20 dark:bg-[#0a1a2b]/96 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,164,65,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(179,120,27,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(120,78,18,0.10),transparent_40%)]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-400/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-[#f0bd5a] dark:border-amber-500/25 dark:bg-amber-400/10 dark:text-[#f4d18a]">
                <Sparkles className="h-3.5 w-3.5" /> Classical Dashboard
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Real saved records
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-[0.02em] text-slate-950 dark:text-[#f6dda6] sm:text-4xl">
              IVS Books Command Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 dark:text-[#c8b894] sm:text-base">
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

      
        

      {/* GRADE SETS SHORTCUT */}
      <button
        type="button"
        onClick={() => onNavigate("gradesets")}
        className="group w-full overflow-hidden rounded-[1.35rem] border border-rose-500/25 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-[#0d2136] dark:via-[#0a1a2b] dark:to-[#071421] p-6 text-left shadow-xl shadow-slate-900/[0.06] dark:shadow-black/20 transition-all hover:-translate-y-0.5 hover:border-amber-400/45 hover:shadow-2xl"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-rose-500/25 dark:bg-[#0d2136] p-4 text-[#d7a944] shadow-sm">
              <Layers className="h-7 w-7" />
            </div>

            <div>
              <p className="text-[10px] font-mono font-extrabold uppercase tracking-[0.22em] text-[#d7a944]">
                Grade Wise Set System
              </p>

              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f5d99e]">
                View Complete Book Sets by Grade
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-[#9f8f70]">
                Open the grade set page to see Grade 1 to Grade 10 cards, complete sets available,
                limiting books, location-wise stock, and remaining books after sets.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#9f6b1b] to-[#d6ad55] px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-amber-900/25">
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
        <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/88 dark:border-amber-500/20 dark:bg-[#0a1a2b]/94 p-6 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/20 backdrop-blur-xl dark:border-amber-500/20 dark:bg-[#0a1a2b]/94 xl:col-span-2">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-lg font-extrabold text-slate-950 dark:text-[#f6dda6]">
                Monthly Sales & Stock In
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-[#9f8f70] dark:text-slate-500 dark:text-[#8c7c5f]">
                Last six months calculated from saved sales and stock entries.
              </p>
            </div>
            <span className="rounded-full border border-amber-500/35 bg-amber-400/10 px-3 py-1 text-xs font-extrabold text-[#f0bd5a] dark:border-amber-500/25 dark:bg-amber-400/10 dark:text-[#f4d18a]">
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
                    backgroundColor: "rgba(8,21,34,0.98)",
                    borderColor: "rgba(214,162,63,0.35)",
                    borderRadius: "18px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales Amount"
                  stroke="#d6a23f"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#d6a23f", strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="stockIn"
                  name="Stock Added"
                  stroke="#8fb7ff"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#8fb7ff", strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/88 dark:border-amber-500/20 dark:bg-[#0a1a2b]/94 p-6 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/20 backdrop-blur-xl dark:border-amber-500/20 dark:bg-[#0a1a2b]/94">
          <div className="mb-3">
            <h3 className="font-display text-lg font-extrabold text-slate-950 dark:text-[#f6dda6]">
              Book Stock Status
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-[#9f8f70] dark:text-slate-500 dark:text-[#8c7c5f]">
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
            <LegendItem color="bg-[#b77a19]" label="Available" value={availableBooksList.length} />
            <LegendItem color="bg-amber-500" label="Low Stock" value={lowStockBooksList.length} />
            <LegendItem color="bg-rose-500/100" label="Out of Stock" value={outOfStockBooksList.length} />
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
      className="group inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/90 dark:border-amber-500/20 dark:bg-[#0d2136]/90 px-4 py-3 text-xs font-extrabold text-slate-700 dark:text-[#d8c49b] shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-500/35 hover:bg-amber-400/10 hover:text-[#f0bd5a] dark:border-amber-500/20 dark:bg-[#0d2136]/5 dark:text-[#e4d2ad] dark:hover:bg-amber-400/10 dark:hover:text-[#f4d18a]"
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
    blue: "from-[#b77a19] to-[#e0b85c] text-[#dca93f] bg-amber-400/10 border-amber-500/25 dark:bg-amber-400/10 dark:border-amber-500/25 dark:text-[#f1c66e]",
    emerald: "from-emerald-600 to-teal-500 text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-400/10 dark:border-emerald-400/20 dark:text-emerald-300",
    indigo: "from-[#9b6a1d] to-[#d7a944] text-[#dca93f] bg-amber-400/10 border-amber-500/25 dark:bg-indigo-400/10 dark:border-indigo-400/20 dark:text-indigo-300",
    purple: "from-[#8f5a16] to-[#d5a23b] text-[#dca93f] bg-amber-400/10 border-amber-500/25 dark:bg-fuchsia-400/10 dark:border-fuchsia-400/20 dark:text-fuchsia-300",
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white/88 dark:border-amber-500/20 dark:bg-[#0a1a2b]/94 p-5 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/20 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-amber-500/20 dark:bg-[#0a1a2b]/94">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneClasses.split(" ").slice(0, 2).join(" ")}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-[#8c7c5f] dark:text-slate-600 dark:text-[#9f8f70]">
            {title}
          </p>
          <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-[#f6dda6]">
            {value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-[#9f8f70] dark:text-slate-500 dark:text-[#8c7c5f]">
            {helper}
          </p>
        </div>
        <div className={`rounded-lg border p-3 ${toneClasses}`}>
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
      className="rounded-[1.15rem] border border-slate-200/80 bg-white/82 dark:border-amber-500/20 dark:bg-[#0d2136]/88 p-4 text-left shadow-lg shadow-slate-900/[0.05] dark:shadow-black/15 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-amber-500/35 hover:bg-amber-400/10 dark:border-amber-500/20 dark:bg-[#0d2136]/88 dark:hover:bg-amber-400/10"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-[#8c7c5f] dark:text-slate-600 dark:text-[#9f8f70]">{label}</p>
          <p className="mt-2 text-xl font-extrabold text-slate-950 dark:text-[#f6dda6]">{value}</p>
        </div>
        <div className="rounded-lg border border-amber-500/25 bg-amber-400/10 p-3 text-[#dca93f] dark:border-amber-500/25 dark:bg-amber-400/10 dark:text-[#f1c66e]">
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
  const color = trend === "down" ? "text-rose-400 bg-rose-500/10 border-rose-500/25 dark:bg-rose-400/10 dark:border-rose-400/20 dark:text-rose-300" : trend === "up" ? "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-400/10 dark:border-emerald-400/20 dark:text-emerald-300" : "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-400/10 dark:border-amber-400/20 dark:text-amber-300";

  return (
    <div className="rounded-[1.15rem] border border-slate-200/80 bg-white/88 dark:border-amber-500/20 dark:bg-[#0a1a2b]/94 p-5 shadow-lg shadow-slate-900/[0.05] dark:shadow-black/15 backdrop-blur-xl dark:border-amber-500/20 dark:bg-[#0a1a2b]/92">
      <div className="flex items-start justify-between">
        <div className="rounded-lg border border-amber-500/25 bg-amber-400/10 p-3 text-[#dca93f] dark:border-amber-500/25 dark:bg-amber-400/10 dark:text-[#f1c66e]">
          <Icon className="h-5 w-5" />
        </div>
        <div className={`rounded-full border px-2.5 py-1 ${color}`}>
          <TrendIcon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500 dark:text-[#8c7c5f] dark:text-slate-600 dark:text-[#9f8f70]">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-950 dark:text-[#f6dda6]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-[#9f8f70] dark:text-slate-500 dark:text-[#8c7c5f]">{helper}</p>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200/75 bg-slate-50/85 dark:border-amber-500/20 dark:bg-[#0c1d30]/90 px-4 py-3 dark:border-amber-500/20 dark:bg-[#0d2136]/5">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-xs font-bold text-slate-600 dark:text-[#c8b894]">{label}</span>
      </div>
      <span className="text-sm font-extrabold text-slate-950 dark:text-[#f6dda6]">{value}</span>
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
  const toneClass = tone === "rose" ? "text-rose-400 bg-rose-500/10 border-rose-500/25 dark:bg-rose-400/10 dark:border-rose-400/20 dark:text-rose-300" : "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-400/10 dark:border-amber-400/20 dark:text-amber-300";

  return (
    <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/88 dark:border-amber-500/20 dark:bg-[#0a1a2b]/94 p-6 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/20 backdrop-blur-xl dark:border-amber-500/20 dark:bg-[#0a1a2b]/94">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-amber-500/18 pb-4 dark:border-amber-500/20">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-slate-950 dark:text-[#f6dda6]">
            <AlertTriangle className={`h-5 w-5 ${tone === "rose" ? "text-[#d7a944]" : "text-amber-500"}`} />
            {title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-[#9f8f70] dark:text-slate-500 dark:text-[#8c7c5f]">{description}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${toneClass}`}>{books.length}</span>
      </div>

      <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
        {books.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-500/20 bg-[#0c1d30]/90 p-8 text-center text-sm font-semibold text-slate-600 dark:text-[#9f8f70] dark:border-amber-500/20 dark:bg-[#0d2136]/5 dark:text-slate-500 dark:text-[#8c7c5f]">
            {emptyText}
          </div>
        ) : (
          books.map((book) => {
            const stock = getBookTotalStock(book);
            return (
              <div key={book.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/75 bg-white/82 dark:border-amber-500/20 dark:bg-[#0d2136]/88 p-4 shadow-sm transition-all hover:border-amber-500/35 hover:bg-amber-400/10/50 dark:border-amber-500/20 dark:bg-[#0d2136]/5 dark:hover:bg-amber-400/10">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-extrabold text-[#f7e8c8] dark:text-slate-950 dark:text-[#f5d99e]">{book.title}</h4>
                  <p className="mt-1 text-xs font-mono font-semibold text-slate-500 dark:text-[#8c7c5f] dark:text-slate-600 dark:text-[#9f8f70]">
                    Code: {book.book_number} • Reorder: {book.reorder_level}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-lg border px-3 py-1 text-xs font-extrabold ${toneClass}`}>{stock} left</span>
                  <button
                    onClick={() => onTriggerAddStock(book.id)}
                    className="rounded-lg bg-gradient-to-r from-[#b77a19] to-[#7f5311] p-2 text-white shadow-lg shadow-amber-900/25 transition-all hover:-translate-y-0.5"
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
    <div className="rounded-[1.35rem] border border-slate-200/80 bg-white/88 dark:border-amber-500/20 dark:bg-[#0a1a2b]/94 p-6 shadow-xl shadow-slate-900/[0.06] dark:shadow-black/20 backdrop-blur-xl dark:border-amber-500/20 dark:bg-[#0a1a2b]/94">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-amber-500/18 pb-4 dark:border-amber-500/20">
        <div>
          <h3 className="font-display text-lg font-extrabold text-slate-950 dark:text-[#f6dda6]">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-[#9f8f70] dark:text-slate-500 dark:text-[#8c7c5f]">Latest saved records</p>
        </div>
        <button
          onClick={onAction}
          className="rounded-lg border border-amber-500/35 bg-amber-400/10 px-4 py-2 text-xs font-extrabold text-[#f0bd5a] transition-all hover:bg-amber-400/15 dark:border-amber-500/25 dark:bg-amber-400/10 dark:text-[#f4d18a]"
        >
          {actionLabel}
        </button>
      </div>

      <div className="space-y-3">
        {hasChildren ? (
          children
        ) : (
          <div className="rounded-xl border border-dashed border-amber-500/20 bg-[#0c1d30]/90 p-8 text-center text-sm font-semibold text-slate-600 dark:text-[#9f8f70] dark:border-amber-500/20 dark:bg-[#0d2136]/5 dark:text-slate-500 dark:text-[#8c7c5f]">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ title, subtitle, value }: { title: string; subtitle: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/75 bg-white/82 dark:border-amber-500/20 dark:bg-[#0d2136]/88 p-4 shadow-sm dark:border-amber-500/20 dark:bg-[#0d2136]/5">
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[#f7e8c8] dark:text-slate-950 dark:text-[#f5d99e]">{title}</p>
        <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-[#9f8f70] dark:text-slate-500 dark:text-[#8c7c5f]">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-lg border border-slate-200/75 bg-slate-50 dark:border-amber-500/20 dark:bg-[#0c1d30] px-3 py-1 text-xs font-extrabold text-slate-700 dark:text-[#d8c49b] dark:border-amber-500/20 dark:bg-[#0d2136]/5 dark:text-[#e4d2ad]">
        {value}
      </span>
    </div>
  );
}