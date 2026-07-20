import React, { useState, useMemo } from "react";
import { DatabaseSchema, StockHistory, Sale, CustomerReturn, PublisherReturn, StockTransfer, DamageLossRecord } from "../types";
import { exportToPDF } from "../utils/pdfExport";
import { 
  Calendar, FileText, Printer, Download, Search, RefreshCw, 
  ArrowUpDown, ChevronDown, ChevronRight, CheckCircle2, TrendingUp, AlertCircle, Sparkles, Sliders
} from "lucide-react";

interface MonthlyRecordsViewProps {
  data: DatabaseSchema;
}

export default function MonthlyRecordsView({ data }: MonthlyRecordsViewProps) {
    const MAX_RENDERED_ROWS = 150;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [filterPublisher, setFilterPublisher] = useState<string>("");
  const [filterBook, setFilterBook] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const [activeTableTab, setActiveTableTab] = useState<string>("entries");

  const monthsList = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const yearsList = [2024, 2025, 2026, 2027, 2028];
    const bookById = useMemo(() => {
    return new Map(data.books.map((book) => [book.id, book]));
  }, [data.books]);

  const locationById = useMemo(() => {
    return new Map(data.locations.map((location) => [location.id, location]));
  }, [data.locations]);

  const publisherById = useMemo(() => {
    return new Map(data.publishers.map((publisher) => [publisher.id, publisher]));
  }, [data.publishers]);

  const saleItemsBySaleId = useMemo(() => {
    const map = new Map<string, typeof data.sale_items>();

    for (const item of data.sale_items) {
      const items = map.get(item.sale_id) || [];
      items.push(item);
      map.set(item.sale_id, items);
    }

    return map;
  }, [data.sale_items]);

  const stockBalancesByBookId = useMemo(() => {
    const map = new Map<string, typeof data.stock_balances>();

    for (const balance of data.stock_balances) {
      const balances = map.get(balance.book_id) || [];
      balances.push(balance);
      map.set(balance.book_id, balances);
    }

    return map;
  }, [data.stock_balances]);

  const startOfMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, 1);
  }, [selectedMonth, selectedYear]);

  const endOfMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
  }, [selectedMonth, selectedYear]);

  const filteredBooksMap = useMemo(() => {
    const map = new Map<string, boolean>();
    data.books.forEach(b => {
      let match = true;
      if (filterPublisher && b.publisher_id !== filterPublisher) match = false;
      if (filterBook && b.id !== filterBook) match = false;
      if (filterCategory && b.category_id !== filterCategory) match = false;
      if (filterSubject && b.subject_id !== filterSubject) match = false;
      if (filterClass && b.class_id !== filterClass) match = false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(query);
        const matchesCode = b.book_number.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCode) match = false;
      }
      map.set(b.id, match);
    });
    return map;
  }, [data.books, filterPublisher, filterBook, filterCategory, filterSubject, filterClass, searchQuery]);

  const isWithinMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= startOfMonth && d <= endOfMonth;
  };

  const monthlyEntries = useMemo(() => {
    return data.stock_entries.filter(entry => {
      return isWithinMonth(entry.date) && 
             filteredBooksMap.get(entry.book_id) &&
             (!filterLocation || entry.location_id === filterLocation);
    });
  }, [data.stock_entries, startOfMonth, endOfMonth, filteredBooksMap, filterLocation]);

    const monthlySales = useMemo(() => {
    return data.sales.filter((sale) => {
      if (!isWithinMonth(sale.date)) return false;
      if (filterLocation && sale.location_id !== filterLocation) return false;

      const items = saleItemsBySaleId.get(sale.id) || [];
      return items.some((item) => filteredBooksMap.get(item.book_id));
    });
  }, [data.sales, startOfMonth, endOfMonth, filterLocation, filteredBooksMap, saleItemsBySaleId]);

  const monthlyCustomerReturns = useMemo(() => {
    return data.customer_returns.filter(ret => {
      return isWithinMonth(ret.date) && 
             filteredBooksMap.get(ret.book_id) &&
             (!filterLocation || ret.location_id === filterLocation);
    });
  }, [data.customer_returns, startOfMonth, endOfMonth, filteredBooksMap, filterLocation]);

  const monthlyPublisherReturns = useMemo(() => {
    return data.publisher_returns.filter(ret => {
      return isWithinMonth(ret.date) && 
             filteredBooksMap.get(ret.book_id) &&
             (!filterLocation || ret.location_id === filterLocation) &&
             (!filterPublisher || ret.publisher_id === filterPublisher);
    });
  }, [data.publisher_returns, startOfMonth, endOfMonth, filteredBooksMap, filterLocation, filterPublisher]);

  const monthlyTransfers = useMemo(() => {
    return data.stock_transfers.filter(trn => {
      return isWithinMonth(trn.date) && 
             filteredBooksMap.get(trn.book_id) &&
             (!filterLocation || trn.from_location_id === filterLocation || trn.to_location_id === filterLocation);
    });
  }, [data.stock_transfers, startOfMonth, endOfMonth, filteredBooksMap, filterLocation]);

  const monthlyDamageLoss = useMemo(() => {
    return data.damage_loss_records.filter(dmg => {
      return isWithinMonth(dmg.date) && 
             filteredBooksMap.get(dmg.book_id) &&
             (!filterLocation || dmg.location_id === filterLocation);
    });
  }, [data.damage_loss_records, startOfMonth, endOfMonth, filteredBooksMap, filterLocation]);

  const openingStockQty = useMemo(() => {
    let qty = 0;
    data.stock_history.forEach(hist => {
      const d = new Date(hist.date);
      if (d < startOfMonth && filteredBooksMap.get(hist.book_id)) {
        if (!filterLocation || hist.location_id === filterLocation) {
          qty += hist.quantity_in - hist.quantity_out;
        }
      }
    });
    return qty;
  }, [data.stock_history, startOfMonth, filteredBooksMap, filterLocation]);

  const totalAddedQty = useMemo(() => {
    return monthlyEntries.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [monthlyEntries]);

    const totalSoldQty = useMemo(() => {
    let qty = 0;

    for (const sale of monthlySales) {
      const items = saleItemsBySaleId.get(sale.id) || [];

      for (const item of items) {
        if (filteredBooksMap.get(item.book_id)) {
          qty += item.quantity;
        }
      }
    }

    return qty;
  }, [monthlySales, saleItemsBySaleId, filteredBooksMap]);

  const totalCustReturnQty = useMemo(() => {
    return monthlyCustomerReturns.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [monthlyCustomerReturns]);

  const totalPubReturnQty = useMemo(() => {
    return monthlyPublisherReturns.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [monthlyPublisherReturns]);

  const totalDamageQty = useMemo(() => {
    return monthlyDamageLoss.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [monthlyDamageLoss]);

  const transfersInQty = useMemo(() => {
    return monthlyTransfers.reduce((acc, curr) => {
      if (filterLocation && curr.to_location_id !== filterLocation) return acc;
      return acc + curr.quantity;
    }, 0);
  }, [monthlyTransfers, filterLocation]);

  const transfersOutQty = useMemo(() => {
    return monthlyTransfers.reduce((acc, curr) => {
      if (filterLocation && curr.from_location_id !== filterLocation) return acc;
      return acc + curr.quantity;
    }, 0);
  }, [monthlyTransfers, filterLocation]);

  const closingStockQty = useMemo(() => {
    return openingStockQty + totalAddedQty + totalCustReturnQty - totalSoldQty - totalPubReturnQty - totalDamageQty + (filterLocation ? (transfersInQty - transfersOutQty) : 0);
  }, [openingStockQty, totalAddedQty, totalCustReturnQty, totalSoldQty, totalPubReturnQty, totalDamageQty, filterLocation, transfersInQty, transfersOutQty]);

    const totalSalesRevenue = useMemo(() => {
    let rev = 0;

    for (const sale of monthlySales) {
      const items = saleItemsBySaleId.get(sale.id) || [];

      for (const item of items) {
        if (filteredBooksMap.get(item.book_id)) {
          rev += item.line_total;
        }
      }
    }

    return rev;
  }, [monthlySales, saleItemsBySaleId, filteredBooksMap]);

  const totalStockValue = useMemo(() => {
    let val = 0;
    data.books.forEach(b => {
      if (filteredBooksMap.get(b.id)) {
        let bookStock = 0;
        data.stock_history.forEach(hist => {
          if (hist.book_id === b.id && new Date(hist.date) <= endOfMonth) {
            if (!filterLocation || hist.location_id === filterLocation) {
              bookStock += hist.quantity_in - hist.quantity_out;
            }
          }
        });
        if (bookStock < 0) bookStock = 0;
        val += bookStock * b.purchase_cost;
      }
    });
    return val;
  }, [data.books, data.stock_history, endOfMonth, filteredBooksMap, filterLocation]);

    const grossProfit = useMemo(() => {
    let costOfGoodsSold = 0;

    for (const sale of monthlySales) {
      const items = saleItemsBySaleId.get(sale.id) || [];

      for (const item of items) {
        if (filteredBooksMap.get(item.book_id)) {
          const book = bookById.get(item.book_id);

          if (book) {
            costOfGoodsSold += item.quantity * book.purchase_cost;
          }
        }
      }
    }

    return totalSalesRevenue - costOfGoodsSold;
  }, [monthlySales, saleItemsBySaleId, filteredBooksMap, bookById, totalSalesRevenue]);

  const bookWiseSummary = useMemo(() => {
    return data.books.filter(b => filteredBooksMap.get(b.id)).map(book => {
      let added = 0;
      let sold = 0;
      let returnedCust = 0;
      let returnedPub = 0;
      let damaged = 0;
      
      monthlyEntries.filter(e => e.book_id === book.id).forEach(e => added += e.quantity);
      monthlyCustomerReturns.filter(e => e.book_id === book.id).forEach(e => returnedCust += e.quantity);
      monthlyPublisherReturns.filter(e => e.book_id === book.id).forEach(e => returnedPub += e.quantity);
      monthlyDamageLoss.filter(e => e.book_id === book.id).forEach(e => damaged += e.quantity);
      
      monthlySales.forEach(sale => {
        data.sale_items.filter(item => item.sale_id === sale.id && item.book_id === book.id).forEach(item => sold += item.quantity);
      });

      let stock = 0;
      data.stock_balances.filter(sb => sb.book_id === book.id).forEach(sb => {
        if (!filterLocation || sb.location_id === filterLocation) {
          stock += sb.quantity;
        }
      });

      return {
        id: book.id,
        code: book.book_number,
        title: book.title,
        added,
        sold,
        returnedCust,
        returnedPub,
        damaged,
        closing: stock,
        value: stock * book.purchase_cost
      };
    });
  }, [data.books, filteredBooksMap, monthlyEntries, monthlyCustomerReturns, monthlyPublisherReturns, monthlyDamageLoss, monthlySales, data.sale_items, data.stock_balances, filterLocation]);

  const publisherWiseSummary = useMemo(() => {
    return data.publishers.map(pub => {
      const pubBooks = data.books.filter(b => b.publisher_id === pub.id && filteredBooksMap.get(b.id));
      let totalStock = 0;
      let totalVal = 0;
      let sold = 0;

      pubBooks.forEach(b => {
        data.stock_balances.filter(sb => sb.book_id === b.id).forEach(sb => {
          if (!filterLocation || sb.location_id === filterLocation) {
            totalStock += sb.quantity;
          }
        });
        totalVal += totalStock * b.purchase_cost;

        monthlySales.forEach(sale => {
          data.sale_items.filter(item => item.sale_id === sale.id && item.book_id === b.id).forEach(item => {
            sold += item.quantity;
          });
        });
      });

      return {
        id: pub.id,
        name: pub.publisher_name,
        code: pub.publisher_number,
        booksCount: pubBooks.length,
        stock: totalStock,
        value: totalVal,
        sold
      };
    }).filter(p => p.booksCount > 0);
  }, [data.publishers, data.books, filteredBooksMap, data.stock_balances, filterLocation, monthlySales, data.sale_items]);

  const locationWiseSummary = useMemo(() => {
    return data.locations.map(loc => {
      let totalStock = 0;
      let totalValue = 0;
      let sold = 0;

      data.books.filter(b => filteredBooksMap.get(b.id)).forEach(b => {
        const bal = data.stock_balances.find(sb => sb.book_id === b.id && sb.location_id === loc.id);
        if (bal) {
          totalStock += bal.quantity;
          totalValue += bal.quantity * b.purchase_cost;
        }

        const locSales = monthlySales.filter(s => s.location_id === loc.id);
        locSales.forEach(sale => {
          data.sale_items.filter(item => item.sale_id === sale.id && item.book_id === b.id).forEach(item => {
            sold += item.quantity;
          });
        });
      });

      return {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        type: loc.type,
        stock: totalStock,
        value: totalValue,
        sold
      };
    });
  }, [data.locations, data.books, filteredBooksMap, data.stock_balances, monthlySales, data.sale_items]);

  const handlePrint = () => {
      const visibleMonthlyEntries = useMemo(() => {
    return monthlyEntries.slice(0, MAX_RENDERED_ROWS);
  }, [monthlyEntries]);

  const visibleMonthlySales = useMemo(() => {
    return monthlySales.slice(0, MAX_RENDERED_ROWS);
  }, [monthlySales]);

  const visibleMonthlyCustomerReturns = useMemo(() => {
    return monthlyCustomerReturns.slice(0, MAX_RENDERED_ROWS);
  }, [monthlyCustomerReturns]);

  const visibleMonthlyPublisherReturns = useMemo(() => {
    return monthlyPublisherReturns.slice(0, MAX_RENDERED_ROWS);
  }, [monthlyPublisherReturns]);

  const visibleMonthlyTransfers = useMemo(() => {
    return monthlyTransfers.slice(0, MAX_RENDERED_ROWS);
  }, [monthlyTransfers]);

  const visibleMonthlyDamageLoss = useMemo(() => {
    return monthlyDamageLoss.slice(0, MAX_RENDERED_ROWS);
  }, [monthlyDamageLoss]);

  const visibleBookWiseSummary = useMemo(() => {
    return bookWiseSummary.slice(0, MAX_RENDERED_ROWS);
  }, [bookWiseSummary]);

  const visiblePublisherWiseSummary = useMemo(() => {
    return publisherWiseSummary.slice(0, MAX_RENDERED_ROWS);
  }, [publisherWiseSummary]);

  const visibleLocationWiseSummary = useMemo(() => {
    return locationWiseSummary.slice(0, MAX_RENDERED_ROWS);
  }, [locationWiseSummary]);
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let titleStr = `monthly_report_${selectedMonth}_${selectedYear}`;

    if (activeTableTab === "entries") {
      headers = ["Entry No", "Date", "Book", "Warehouse", "Quantity", "Unit Cost", "Reference", "Notes"];
      rows = monthlyEntries.map(e => [
        e.entry_number,
        new Date(e.date).toLocaleDateString(),
        data.books.find(b => b.id === e.book_id)?.title || "",
        data.locations.find(l => l.id === e.location_id)?.name || "",
        e.quantity,
        e.unit_cost,
        e.reference_number || "",
        e.notes || ""
      ]);
    } else if (activeTableTab === "sales") {
      headers = ["Sale No", "Date", "Customer", "Location", "Payment Method", "Discount", "Total Amount"];
      rows = monthlySales.map(s => [
        s.sale_number,
        new Date(s.date).toLocaleDateString(),
        s.customer_name || "Walk-in",
        data.locations.find(l => l.id === s.location_id)?.name || "",
        s.payment_method,
        s.discount,
        s.total_amount
      ]);
    } else if (activeTableTab === "cust-returns") {
      headers = ["Return No", "Date", "Customer", "Book", "Location", "Quantity", "Reason"];
      rows = monthlyCustomerReturns.map(r => [
        r.return_number,
        new Date(r.date).toLocaleDateString(),
        r.customer_name || "N/A",
        data.books.find(b => b.id === r.book_id)?.title || "",
        data.locations.find(l => l.id === r.location_id)?.name || "",
        r.quantity,
        r.reason
      ]);
    } else if (activeTableTab === "pub-returns") {
      headers = ["Return No", "Date", "Publisher", "Book", "Location", "Quantity", "Reason"];
      rows = monthlyPublisherReturns.map(r => [
        r.return_number,
        new Date(r.date).toLocaleDateString(),
        data.publishers.find(p => p.id === r.publisher_id)?.publisher_name || "",
        data.books.find(b => b.id === r.book_id)?.title || "",
        data.locations.find(l => l.id === r.location_id)?.name || "",
        r.quantity,
        r.reason
      ]);
    } else if (activeTableTab === "transfers") {
      headers = ["Transfer No", "Date", "From Location", "To Location", "Book", "Quantity"];
      rows = monthlyTransfers.map(t => [
        t.transfer_number,
        new Date(t.date).toLocaleDateString(),
        data.locations.find(l => l.id === t.from_location_id)?.name || "",
        data.locations.find(l => l.id === t.to_location_id)?.name || "",
        data.books.find(b => b.id === t.book_id)?.title || "",
        t.quantity
      ]);
    } else if (activeTableTab === "damage") {
      headers = ["Date", "Book", "Location", "Quantity", "Reason", "Notes"];
      rows = monthlyDamageLoss.map(d => [
        new Date(d.date).toLocaleDateString(),
        data.books.find(b => b.id === d.book_id)?.title || "",
        data.locations.find(l => l.id === d.location_id)?.name || "",
        d.quantity,
        d.reason,
        d.notes || ""
      ]);
    } else if (activeTableTab === "book-summary") {
      headers = ["Code", "Book Title", "Added (Month)", "Sold (Month)", "Customer Returns", "Publisher Returns", "Closing Stock", "Value (PKR)"];
      rows = bookWiseSummary.map(b => [
        b.code, b.title, b.added, b.sold, b.returnedCust, b.returnedPub, b.closing, b.value
      ]);
    } else if (activeTableTab === "pub-summary") {
      headers = ["Publisher Code", "Publisher Name", "Books Count", "Sold", "Closing Stock", "Stock Value (PKR)"];
      rows = publisherWiseSummary.map(p => [
        p.code, p.name, p.booksCount, p.sold, p.stock, p.value
      ]);
    } else if (activeTableTab === "loc-summary") {
      headers = ["Code", "Location Name", "Type", "Sold", "Closing Stock", "Stock Value (PKR)"];
      rows = locationWiseSummary.map(l => [
        l.code, l.name, l.type, l.sold, l.stock, l.value
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${titleStr}_${activeTableTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    let title = "";
    let cols: { header: string; dataKey: string }[] = [];
    let rows: any[] = [];

    if (activeTableTab === "entries") {
      title = `Monthly Stock Entries - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Entry No", dataKey: "col1" },
        { header: "Date", dataKey: "col2" },
        { header: "Book Title", dataKey: "col3" },
        { header: "Warehouse", dataKey: "col4" },
        { header: "Quantity", dataKey: "col5" },
        { header: "Unit Cost", dataKey: "col6" }
      ];
      rows = monthlyEntries.map(e => ({
        col1: e.entry_number,
        col2: new Date(e.date).toLocaleDateString(),
        col3: data.books.find(b => b.id === e.book_id)?.title || "",
        col4: data.locations.find(l => l.id === e.location_id)?.name || "",
        col5: e.quantity,
        col6: `PKR ${e.unit_cost}`
      }));
    } else if (activeTableTab === "sales") {
      title = `Monthly Sales - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Sale No", dataKey: "col1" },
        { header: "Date", dataKey: "col2" },
        { header: "Customer Name", dataKey: "col3" },
        { header: "Location", dataKey: "col4" },
        { header: "Total", dataKey: "col5" }
      ];
      rows = monthlySales.map(s => ({
        col1: s.sale_number,
        col2: new Date(s.date).toLocaleDateString(),
        col3: s.customer_name || "Walk-in",
        col4: data.locations.find(l => l.id === s.location_id)?.name || "",
        col5: `PKR ${s.total_amount}`
      }));
    } else if (activeTableTab === "cust-returns") {
      title = `Monthly Customer Returns - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Return No", dataKey: "col1" },
        { header: "Date", dataKey: "col2" },
        { header: "Customer", dataKey: "col3" },
        { header: "Book Title", dataKey: "col4" },
        { header: "Qty", dataKey: "col5" }
      ];
      rows = monthlyCustomerReturns.map(r => ({
        col1: r.return_number,
        col2: new Date(r.date).toLocaleDateString(),
        col3: r.customer_name || "N/A",
        col4: data.books.find(b => b.id === r.book_id)?.title || "",
        col5: r.quantity
      }));
    } else if (activeTableTab === "pub-returns") {
      title = `Monthly Publisher Returns - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Return No", dataKey: "col1" },
        { header: "Date", dataKey: "col2" },
        { header: "Publisher", dataKey: "col3" },
        { header: "Book Title", dataKey: "col4" },
        { header: "Qty", dataKey: "col5" }
      ];
      rows = monthlyPublisherReturns.map(r => ({
        col1: r.return_number,
        col2: new Date(r.date).toLocaleDateString(),
        col3: data.publishers.find(p => p.id === r.publisher_id)?.publisher_name || "",
        col4: data.books.find(b => b.id === r.book_id)?.title || "",
        col5: r.quantity
      }));
    } else if (activeTableTab === "transfers") {
      title = `Monthly Stock Transfers - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Transfer No", dataKey: "col1" },
        { header: "Date", dataKey: "col2" },
        { header: "From", dataKey: "col3" },
        { header: "To", dataKey: "col4" },
        { header: "Book Title", dataKey: "col5" },
        { header: "Qty", dataKey: "col6" }
      ];
      rows = monthlyTransfers.map(t => ({
        col1: t.transfer_number,
        col2: new Date(t.date).toLocaleDateString(),
        col3: data.locations.find(l => l.id === t.from_location_id)?.name || "",
        col4: data.locations.find(l => l.id === t.to_location_id)?.name || "",
        col5: data.books.find(b => b.id === t.book_id)?.title || "",
        col6: t.quantity
      }));
    } else if (activeTableTab === "damage") {
      title = `Monthly Damage & Loss - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Date", dataKey: "col1" },
        { header: "Book Title", dataKey: "col2" },
        { header: "Location", dataKey: "col3" },
        { header: "Qty", dataKey: "col4" },
        { header: "Reason", dataKey: "col5" }
      ];
      rows = monthlyDamageLoss.map(d => ({
        col1: new Date(d.date).toLocaleDateString(),
        col2: data.books.find(b => b.id === d.book_id)?.title || "",
        col3: data.locations.find(l => l.id === d.location_id)?.name || "",
        col4: d.quantity,
        col5: d.reason
      }));
    } else if (activeTableTab === "book-summary") {
      title = `Monthly Book Stock Summary - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Code", dataKey: "col1" },
        { header: "Title", dataKey: "col2" },
        { header: "In (Month)", dataKey: "col3" },
        { header: "Out (Month)", dataKey: "col4" },
        { header: "Cust Ret", dataKey: "col5" },
        { header: "Pub Ret", dataKey: "col6" },
        { header: "Closing", dataKey: "col7" },
        { header: "Value", dataKey: "col8" }
      ];
      rows = bookWiseSummary.map(b => ({
        col1: b.code,
        col2: b.title,
        col3: b.added,
        col4: b.sold,
        col5: b.returnedCust,
        col6: b.returnedPub,
        col7: b.closing,
        col8: `PKR ${b.value}`
      }));
    } else if (activeTableTab === "pub-summary") {
      title = `Monthly Publisher-wise Summary - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Publisher Code", dataKey: "col1" },
        { header: "Publisher Name", dataKey: "col2" },
        { header: "Books Count", dataKey: "col3" },
        { header: "Sold", dataKey: "col4" },
        { header: "Closing", dataKey: "col5" },
        { header: "Value", dataKey: "col6" }
      ];
      rows = publisherWiseSummary.map(p => ({
        col1: p.code,
        col2: p.name,
        col3: p.booksCount,
        col4: p.sold,
        col5: p.stock,
        col6: `PKR ${p.value}`
      }));
    } else if (activeTableTab === "loc-summary") {
      title = `Monthly Location-wise Summary - ${monthsList.find(m => m.value === selectedMonth)?.label} ${selectedYear}`;
      cols = [
        { header: "Code", dataKey: "col1" },
        { header: "Location Name", dataKey: "col2" },
        { header: "Type", dataKey: "col3" },
        { header: "Sold", dataKey: "col4" },
        { header: "Closing", dataKey: "col5" },
        { header: "Value", dataKey: "col6" }
      ];
      rows = locationWiseSummary.map(l => ({
        col1: l.code,
        col2: l.name,
        col3: l.type.toUpperCase(),
        col4: l.sold,
        col5: l.stock,
        col6: `PKR ${l.value}`
      }));
    }

    exportToPDF({
      title,
      subtitle: `System filters applied: Publisher: ${filterPublisher ? "Filtered" : "All"}, Warehouse: ${filterLocation ? "Filtered" : "All"}`,
      columns: cols,
      rows,
      summaryData: [
        { label: "Closing Stock", value: closingStockQty },
        { label: "Sales Revenue", value: `PKR ${totalSalesRevenue}` },
        { label: "Gross Profit", value: `PKR ${grossProfit}` }
      ],
      fileName: `Monthly_${activeTableTab}_${selectedMonth}_${selectedYear}.pdf`
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-5 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            <span>Monthly Business Records</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">
            Analyze complete business ledgers, stock entries, total sales, returns and location balances month-by-month.
          </p>
        </div>
        
        <div className="flex gap-2 text-xs self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all border border-slate-200 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print Monthly Record</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 btn-premium-pink text-white rounded-xl font-bold transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-white/95" />
            <span>Export Audit PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="glass-panel border border-white/60 rounded-2xl p-5 space-y-4 no-print shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-1">
          <Sliders className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-800">Fine-tune Filters</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-bold mb-1">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-bold cursor-pointer focus:outline-none"
            >
              {monthsList.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Select Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-bold cursor-pointer focus:outline-none"
            >
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Publisher</label>
            <select
              value={filterPublisher}
              onChange={(e) => setFilterPublisher(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Publishers --</option>
              {data.publishers.map(p => (
                <option key={p.id} value={p.id}>{p.publisher_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Book / Syllabus</label>
            <select
              value={filterBook}
              onChange={(e) => setFilterBook(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Books --</option>
              {data.books.map(b => (
                <option key={b.id} value={b.id}>{b.book_number} - {b.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Warehouse / Location</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Warehouses --</option>
              {data.locations.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.type.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-bold mb-1">Search Keywords</label>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-700 font-medium focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        {/* ADDITIONAL SELECTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-100">
          <div>
            <label className="block text-slate-500 font-bold mb-1">Category Group</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Categories --</option>
              {data.categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 font-bold mb-1">Curriculum Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Subjects --</option>
              {data.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 font-bold mb-1">Class / Grade</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold cursor-pointer focus:outline-none"
            >
              <option value="">-- All Classes --</option>
              {data.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card border border-slate-200/50 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Opening Stock</p>
          <p className="text-xl font-display font-bold text-slate-800 mt-1">{openingStockQty.toLocaleString()} units</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Starting month balance</div>
        </div>

        <div className="glass-card border border-slate-200/50 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Stock Received</p>
          <p className="text-xl font-display font-bold text-emerald-600 mt-1">+{totalAddedQty.toLocaleString()} units</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">New entries logged</div>
        </div>

        <div className="glass-card border border-slate-200/50 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Sold Units</p>
          <p className="text-xl font-display font-bold text-indigo-600 mt-1">-{totalSoldQty.toLocaleString()} units</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Sales invoice outtakes</div>
        </div>

        <div className="glass-card border border-slate-200/50 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Closing Stock</p>
          <p className="text-xl font-display font-bold text-slate-800 mt-1">{closingStockQty.toLocaleString()} units</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Calculated ending stock</div>
        </div>

        <div className="glass-card border border-slate-200/50 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Sales Revenue</p>
          <p className="text-xl font-display font-bold text-emerald-600 mt-1">PKR {totalSalesRevenue.toLocaleString()}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Net customer receivables</div>
        </div>

        <div className="glass-card border border-slate-200/50 p-4 rounded-2xl shadow-sm">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Stock Value</p>
          <p className="text-xl font-display font-bold text-slate-800 mt-1">PKR {totalStockValue.toLocaleString()}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Valued at purchase cost</div>
        </div>

        <div className="glass-card border border-slate-200/50 p-4 rounded-2xl shadow-sm col-span-2">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Estimated Gross profit</p>
          <p className="text-xl font-display font-bold text-emerald-600 mt-1">PKR {grossProfit.toLocaleString()}</p>
          <div className="text-[9px] text-slate-400 mt-1 font-medium">Sales revenue less cost of goods sold</div>
        </div>
      </div>

      {/* DATA TABS SECTION */}
      <div className="glass-panel rounded-2xl border border-white/60 overflow-hidden shadow-sm">
        
        {/* TAB LIST */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap gap-2 text-xs font-bold items-center">
          {[
            { id: "entries", label: "Entries" },
            { id: "sales", label: "Sales Register" },
            { id: "cust-returns", label: "Cust Returns" },
            { id: "pub-returns", label: "Pub Returns" },
            { id: "transfers", label: "Transfers" },
            { id: "damage", label: "Damage/Loss" },
            { id: "book-summary", label: "Book Summary" },
            { id: "pub-summary", label: "Publisher Summary" },
            { id: "loc-summary", label: "Location Summary" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTableTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTableTab === tab.id 
                  ? "bg-rose-500 text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleExportCSV}
            className="ml-auto flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

                {(activeTableTab === "entries" && monthlyEntries.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "sales" && monthlySales.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "cust-returns" && monthlyCustomerReturns.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "pub-returns" && monthlyPublisherReturns.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "transfers" && monthlyTransfers.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "damage" && monthlyDamageLoss.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "book-summary" && bookWiseSummary.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "pub-summary" && publisherWiseSummary.length > MAX_RENDERED_ROWS) ||
        (activeTableTab === "loc-summary" && locationWiseSummary.length > MAX_RENDERED_ROWS) ? (
          <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 no-print">
            Showing first {MAX_RENDERED_ROWS} rows on screen for better speed. CSV/PDF export still includes all records.
          </div>
        ) : null}

        {/* TAB BODIES */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            
            {activeTableTab === "entries" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Entry No</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Warehouse / Location</th>
                    <th className="px-5 py-3 text-center">Qty Added</th>
                    <th className="px-5 py-3 text-right">Unit Cost</th>
                    <th className="px-5 py-3">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-mono font-medium">No stock entry records found for this period.</td>
                    </tr>
                  ) : (
                    monthlyEntries.map(e => (
                      <tr key={e.id} className="hover:bg-white/40">
                        <td className="px-5 py-4 font-mono font-bold text-rose-500">{e.entry_number}</td>
                        <td className="px-5 py-4 text-slate-500 font-medium">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{data.books.find(b => b.id === e.book_id)?.title}</td>
                        <td className="px-5 py-4 text-slate-500">{data.locations.find(l => l.id === e.location_id)?.name}</td>
                        <td className="px-5 py-4 text-center font-bold text-emerald-600">+{e.quantity}</td>
                        <td className="px-5 py-4 text-right font-mono font-semibold">PKR {e.unit_cost}</td>
                        <td className="px-5 py-4 text-slate-400 font-mono text-[10px]">{e.reference_number || "N/A"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTableTab === "sales" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Invoice No</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Selling Location</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 text-right">Discount</th>
                    <th className="px-5 py-3 text-right font-bold">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlySales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-mono font-medium">No sales invoices found for this period.</td>
                    </tr>
                  ) : (
                    monthlySales.map(s => (
                      <tr key={s.id} className="hover:bg-white/40">
                        <td className="px-5 py-4 font-mono font-bold text-slate-800">{s.sale_number}</td>
                        <td className="px-5 py-4 text-slate-500 font-medium">{new Date(s.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-slate-800 font-bold">{s.customer_name || "Walk-In Customer"}</td>
                        <td className="px-5 py-4 text-slate-500">{data.locations.find(l => l.id === s.location_id)?.name}</td>
                        <td className="px-5 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">{s.payment_method}</span></td>
                        <td className="px-5 py-4 text-right font-mono text-slate-400">PKR {s.discount}</td>
                        <td className="px-5 py-4 text-right font-mono font-extrabold text-emerald-600">PKR {s.total_amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTableTab === "cust-returns" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Return No</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3 text-center">Quantity</th>
                    <th className="px-5 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyCustomerReturns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-mono font-medium">No customer return transactions found for this month.</td>
                    </tr>
                  ) : (
                    monthlyCustomerReturns.map(r => (
                      <tr key={r.id} className="hover:bg-white/40">
                        <td className="px-5 py-4 font-mono font-bold text-rose-500">{r.return_number}</td>
                        <td className="px-5 py-4 text-slate-500 font-medium">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-slate-800 font-semibold">{r.customer_name || "N/A"}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{data.books.find(b => b.id === r.book_id)?.title}</td>
                        <td className="px-5 py-4 text-slate-500">{data.locations.find(l => l.id === r.location_id)?.name}</td>
                        <td className="px-5 py-4 text-center font-mono font-bold text-indigo-600">+{r.quantity}</td>
                        <td className="px-5 py-4 text-slate-600">{r.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTableTab === "pub-returns" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Return No</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Publisher</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">From Location</th>
                    <th className="px-5 py-3 text-center">Quantity</th>
                    <th className="px-5 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyPublisherReturns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-mono font-medium">No publisher returns found for this month.</td>
                    </tr>
                  ) : (
                    monthlyPublisherReturns.map(r => (
                      <tr key={r.id} className="hover:bg-white/40">
                        <td className="px-5 py-4 font-mono font-bold text-rose-500">{r.return_number}</td>
                        <td className="px-5 py-4 text-slate-500 font-medium">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{data.publishers.find(p => p.id === r.publisher_id)?.publisher_name}</td>
                        <td className="px-5 py-4 text-slate-800 font-semibold">{data.books.find(b => b.id === r.book_id)?.title}</td>
                        <td className="px-5 py-4 text-slate-500">{data.locations.find(l => l.id === r.location_id)?.name}</td>
                        <td className="px-5 py-4 text-center font-mono font-bold text-rose-600">-{r.quantity}</td>
                        <td className="px-5 py-4 text-slate-600">{r.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTableTab === "transfers" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Transfer No</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">From Source</th>
                    <th className="px-5 py-3">To Destination</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3 text-center">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-mono font-medium">No stock transfer transactions found for this period.</td>
                    </tr>
                  ) : (
                    monthlyTransfers.map(t => (
                      <tr key={t.id} className="hover:bg-white/40">
                        <td className="px-5 py-4 font-mono font-bold text-indigo-500">{t.transfer_number}</td>
                        <td className="px-5 py-4 text-slate-500 font-medium">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-slate-500">{data.locations.find(l => l.id === t.from_location_id)?.name}</td>
                        <td className="px-5 py-4 text-slate-500">{data.locations.find(l => l.id === t.to_location_id)?.name}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{data.books.find(b => b.id === t.book_id)?.title}</td>
                        <td className="px-5 py-4 text-center font-mono font-extrabold text-indigo-600">{t.quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTableTab === "damage" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Location</th>
                    <th className="px-5 py-3 text-center">Quantity Lost</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyDamageLoss.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-mono font-medium">No damage or write-off records found.</td>
                    </tr>
                  ) : (
                    monthlyDamageLoss.map(d => (
                      <tr key={d.id} className="hover:bg-white/40">
                        <td className="px-5 py-4 text-slate-500 font-medium">{new Date(d.date).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-bold text-slate-800">{data.books.find(b => b.id === d.book_id)?.title}</td>
                        <td className="px-5 py-4 text-slate-500">{data.locations.find(l => l.id === d.location_id)?.name}</td>
                        <td className="px-5 py-4 text-center font-mono font-bold text-rose-600">-{d.quantity}</td>
                        <td className="px-5 py-4 font-semibold text-slate-700">{d.reason}</td>
                        <td className="px-5 py-4 text-slate-400 font-medium">{d.notes || "N/A"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}

            {activeTableTab === "book-summary" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3 text-center">Added (Month)</th>
                    <th className="px-5 py-3 text-center">Sold (Month)</th>
                    <th className="px-5 py-3 text-center">Cust Returns</th>
                    <th className="px-5 py-3 text-center">Pub Returns</th>
                    <th className="px-5 py-3 text-center">Closing Stock</th>
                    <th className="px-5 py-3 text-right">Value (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookWiseSummary.map(b => (
                    <tr key={b.id} className="hover:bg-white/40">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-[10px]">{b.code}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">{b.title}</td>
                      <td className="px-5 py-4 text-center text-emerald-600 font-bold">+{b.added}</td>
                      <td className="px-5 py-4 text-center text-indigo-600">-{b.sold}</td>
                      <td className="px-5 py-4 text-center text-emerald-600">+{b.returnedCust}</td>
                      <td className="px-5 py-4 text-center text-rose-600">-{b.returnedPub}</td>
                      <td className="px-5 py-4 text-center font-bold text-slate-800">{b.closing}</td>
                      <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-900">PKR {b.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {activeTableTab === "pub-summary" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Publisher Code</th>
                    <th className="px-5 py-3">Publisher Name</th>
                    <th className="px-5 py-3 text-center">Books Count</th>
                    <th className="px-5 py-3 text-center">Sold</th>
                    <th className="px-5 py-3 text-center">Closing Stock</th>
                    <th className="px-5 py-3 text-right">Stock Value (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {publisherWiseSummary.map(p => (
                    <tr key={p.id} className="hover:bg-white/40">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-[10px]">{p.code}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">{p.name}</td>
                      <td className="px-5 py-4 text-center font-semibold text-slate-500">{p.booksCount} books</td>
                      <td className="px-5 py-4 text-center text-indigo-600 font-semibold">{p.sold}</td>
                      <td className="px-5 py-4 text-center font-bold text-slate-800">{p.stock}</td>
                      <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-900">PKR {p.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {activeTableTab === "loc-summary" && (
              <>
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-100 font-bold">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Location Name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-center">Sold</th>
                    <th className="px-5 py-3 text-center">Closing Stock</th>
                    <th className="px-5 py-3 text-right">Stock Value (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locationWiseSummary.map(l => (
                    <tr key={l.id} className="hover:bg-white/40">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-[10px]">{l.code}</td>
                      <td className="px-5 py-4 font-bold text-slate-800">{l.name}</td>
                      <td className="px-5 py-4"><span className="bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border border-slate-100">{l.type.toUpperCase()}</span></td>
                      <td className="px-5 py-4 text-center text-indigo-600 font-semibold">{l.sold}</td>
                      <td className="px-5 py-4 text-center font-bold text-slate-800">{l.stock}</td>
                      <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-900">PKR {l.value.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

          </table>
        </div>
      </div>

    </div>
  );
}
