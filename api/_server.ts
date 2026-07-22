import "dotenv/config";
import express from "express";
import helmet from "helmet";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { DatabaseSchema, Publisher, Location, Category, Subject, ClassEntity, Book, StockEntry, StockBalance, StockHistory, Sale, SaleItem, CustomerReturn, PublisherReturn, StockTransfer, DamageLossRecord, LiveLog } from "../src/types";
import { db } from "../src/db/index.ts";
import { 
  publishers, locations, categories, subjects, classes, books, 
  stock_entries, stock_balances, stock_history, sales, sale_items,
  customer_returns, publisher_returns, stock_transfers, damage_loss_records, live_logs 
} from "../src/db/schema.ts";
import { authRouter, usersRouter } from "../server/auth/routes.ts";
import { initializeAuthStore } from "../server/auth/store.ts";
import { requireAuth } from "../server/auth/middleware.ts";
import { authorizeBusinessApi } from "../server/auth/authorization.ts";
import { getCurrentActorEmail, requestContextMiddleware } from "../server/auth/requestContext.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = path.join(process.cwd(), "db.json");
const SETTINGS_PATH = path.join(process.cwd(), "settings.json");

let authInitializationPromise: Promise<void> | null = null;

export function ensureAuthStoreInitialized(): Promise<void> {
  if (!authInitializationPromise) {
    authInitializationPromise = initializeAuthStore();
  }

  return authInitializationPromise;
}

const DATABASE_MODE = (process.env.DATABASE_MODE || "local").toLowerCase();
const USE_LOCAL_DATABASE = DATABASE_MODE === "local";

if (process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;

    const durationMs = Date.now() - startTime;
    const contentLength = res.getHeader("content-length");
    console.log(
      `[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms${
        contentLength ? ` - ${contentLength} bytes` : ""
      }`,
    );
  });

  next();
});

app.use(async (_req, _res, next) => {
  try {
    await ensureAuthStoreInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);

const EMPTY_DB: DatabaseSchema = {
  publishers: [],
  locations: [],
  categories: [],
  subjects: [],
  classes: [],
  books: [],
  stock_entries: [],
  stock_balances: [],
  stock_history: [],
  sales: [],
  sale_items: [],
  customer_returns: [],
  publisher_returns: [],
  stock_transfers: [],
  damage_loss_records: [],
  live_logs: []
};

const DEFAULT_SETTINGS = {
  businessName: "Junaid Books Management System",
  currency: "PKR",
  taxRate: 0,
  globalReorderLevel: 20
};

let cachedDb: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function normalizeDb(data: Partial<DatabaseSchema> = {}): DatabaseSchema {
  return {
    publishers: data.publishers || [],
    locations: data.locations || [],
    categories: data.categories || [],
    subjects: data.subjects || [],
    classes: data.classes || [],
    books: data.books || [],
    stock_entries: data.stock_entries || [],
    stock_balances: data.stock_balances || [],
    stock_history: data.stock_history || [],
    sales: data.sales || [],
    sale_items: data.sale_items || [],
    customer_returns: data.customer_returns || [],
    publisher_returns: data.publisher_returns || [],
    stock_transfers: data.stock_transfers || [],
    damage_loss_records: data.damage_loss_records || [],
    live_logs: data.live_logs || []
  };
}

async function readJsonDb(): Promise<DatabaseSchema> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return normalizeDb(JSON.parse(raw));
  } catch {
    return normalizeDb(EMPTY_DB);
  }
}

async function writeJsonDb(data: DatabaseSchema): Promise<void> {
  const tmpPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(normalizeDb(data), null, 2));
  await fs.rename(tmpPath, DB_PATH);
}

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeSettings(settings: typeof DEFAULT_SETTINGS) {
  const safeSettings = {
    businessName: String(settings.businessName || DEFAULT_SETTINGS.businessName),
    currency: String(settings.currency || DEFAULT_SETTINGS.currency),
    taxRate: Number(settings.taxRate) || 0,
    globalReorderLevel: Number(settings.globalReorderLevel) || DEFAULT_SETTINGS.globalReorderLevel
  };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(safeSettings, null, 2));
  return safeSettings;
}

function makeId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function nextCode<T extends Record<string, any>>(items: T[], field: keyof T, prefix: string, pad = 3, start = 1): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const maxNumber = items.reduce((max, item) => {
    const value = String(item[field] || "");
    const match = value.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, start - 1);
  return `${prefix}-${String(maxNumber + 1).padStart(pad, "0")}`;
}

function nextPlainCode<T extends Record<string, any>>(items: T[], field: keyof T, prefix: string, start = 1001): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const maxNumber = items.reduce((max, item) => {
    const value = String(item[field] || "");
    const match = value.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, start - 1);
  return `${prefix}-${maxNumber + 1}`;
}

function ensureExists<T>(items: T[], predicate: (item: T) => boolean, message: string): T {
  const found = items.find(predicate);
  if (!found) throw new Error(message);
  return found;
}

// Helper to read database. Primary source is PostgreSQL/Supabase. If it is unavailable,
// the app falls back to local db.json so development/testing still works.
async function readDb(forceRefresh = false): Promise<DatabaseSchema> {
  if (cachedDb && !forceRefresh) {
    return cachedDb;
  }
  if (USE_LOCAL_DATABASE) {
  cachedDb = await readJsonDb();
  return cachedDb;
}

  try {
    const [
      pubs, locs, cats, subs, clss, bks, entries, balances, hist, sls, sitems, crets, prets, transfers, dmgs, logs
    ] = await Promise.all([
      db.select().from(publishers),
      db.select().from(locations),
      db.select().from(categories),
      db.select().from(subjects),
      db.select().from(classes),
      db.select().from(books),
      db.select().from(stock_entries),
      db.select().from(stock_balances),
      db.select().from(stock_history),
      db.select().from(sales),
      db.select().from(sale_items),
      db.select().from(customer_returns),
      db.select().from(publisher_returns),
      db.select().from(stock_transfers),
      db.select().from(damage_loss_records),
      db.select().from(live_logs),
    ]);

    cachedDb = normalizeDb({
      publishers: pubs as Publisher[],
      locations: locs as Location[],
      categories: cats as Category[],
      subjects: subs as Subject[],
      classes: clss as ClassEntity[],
      books: bks as Book[],
      stock_entries: entries as StockEntry[],
      stock_balances: balances as StockBalance[],
      stock_history: hist as StockHistory[],
      sales: sls as Sale[],
      sale_items: sitems as SaleItem[],
      customer_returns: crets as CustomerReturn[],
      publisher_returns: prets as PublisherReturn[],
      stock_transfers: transfers as StockTransfer[],
      damage_loss_records: dmgs as DamageLossRecord[],
      live_logs: logs as LiveLog[]
    });
    return cachedDb;
  } catch (error) {
    console.warn("Cloud SQL/Supabase read failed. Using local db.json fallback.", error);
    cachedDb = await readJsonDb();
    return cachedDb;
  }
}

// Helper to write database. Writes are queued to reduce overwrite risk in one Node process.
// If PostgreSQL/Supabase write fails, the same data is saved to local db.json.
async function writeDb(data: DatabaseSchema, tablesToSync?: string[]): Promise<void> {
  

  const runWrite = async () => {

    if (USE_LOCAL_DATABASE) {
      await writeJsonDb(data);
      cachedDb = data;
      return;
    }
    const tablesMap: Record<string, any> = {
      categories,
      subjects,
      classes,
      publishers,
      locations,
      books,
      stock_entries,
      stock_balances,
      stock_history,
      sales,
      sale_items,
      customer_returns,
      publisher_returns,
      stock_transfers,
      damage_loss_records,
      live_logs,
    };

    const list = tablesToSync || Object.keys(tablesMap);

    try {
      await db.transaction(async (tx) => {
        for (const tName of list) {
          const table = tablesMap[tName];
          if (!table) continue;

          await tx.delete(table);
          const rows = (cachedDb as any)[tName];
          if (rows && rows.length > 0) {
            await tx.insert(table).values(rows);
          }
        }
      });
    } catch (error) {
      console.warn("Cloud SQL/Supabase write failed. Saving to local db.json fallback.", error);
      await writeJsonDb(cachedDb as DatabaseSchema);
    }
  };

  writeQueue = writeQueue.then(runWrite, runWrite);
  await writeQueue;
}

// Helper to log action
function createLog(
  db: DatabaseSchema,
  module: string,
  action: string,
  recordNumber: string,
  description: string,
  severity: "info" | "warning" | "error" = "info"
) {
  const log: LiveLog = {
    id: makeId("log"),
    timestamp: new Date().toISOString(),
    user: getCurrentActorEmail(),
    module,
    action,
    record_number: recordNumber,
    description,
    severity
  };
  db.live_logs.unshift(log); // newest first
}

// All business APIs below this point require an authenticated, authorized session.
app.use(
  "/api",
  requireAuth,
  authorizeBusinessApi,
  requestContextMiddleware,
);

// Get all data
app.get(["/api/data", "/api/db"], async (req, res) => {
  try {
    const db = await readDb();
    res.json(db);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/settings", async (_req, res) => {
  try {
    res.json(await readSettings());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const saved = await writeSettings(req.body);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper for location-wise stock updates
function updateStockBalance(db: DatabaseSchema, bookId: string, locationId: string, qtyDiff: number) {
  let balance = db.stock_balances.find(b => b.book_id === bookId && b.location_id === locationId);
  if (!balance) {
    balance = {
      id: makeId("bal"),
      book_id: bookId,
      location_id: locationId,
      quantity: 0
    };
    db.stock_balances.push(balance);
  }

  const nextQuantity = balance.quantity + qtyDiff;
  if (nextQuantity < 0) {
    throw new Error(`Insufficient stock. Current balance is ${balance.quantity}.`);
  }

  balance.quantity = nextQuantity;
  return balance.quantity;
}

// Helper to find stock balance
function getStockBalance(db: DatabaseSchema, bookId: string, locationId: string): number {
  const balance = db.stock_balances.find(b => b.book_id === bookId && b.location_id === locationId);
  return balance ? balance.quantity : 0;
}

// POST Publishers
app.post("/api/publishers", async (req, res) => {
  try {
    const db = await readDb();
    const { publisher_name, contact_person, phone, email, address, credit_days, status } = req.body;

    if (!publisher_name) {
      return res.status(400).json({ error: "Publisher Name is required." });
    }

    const publisher_number = nextCode(db.publishers, "publisher_number", "PUB");

    const newPublisher: Publisher = {
      id: makeId("pub"),
      publisher_number,
      publisher_name,
      contact_person,
      phone,
      email,
      address,
      credit_days: Number(credit_days) || 30,
      status: status || "active",
      created_at: new Date().toISOString()
    };

    db.publishers.push(newPublisher);
    createLog(db, "Publisher", "Create", publisher_number, `Created publisher ${publisher_name} (${publisher_number})`);
    await writeDb(db, ["publishers", "live_logs"]);
    res.status(201).json(newPublisher);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Publishers
app.put("/api/publishers/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;
    const { publisher_name, contact_person, phone, email, address, credit_days, status } = req.body;

    const publisher = db.publishers.find(p => p.id === id);
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found." });
    }

    publisher.publisher_name = publisher_name || publisher.publisher_name;
    publisher.contact_person = contact_person !== undefined ? contact_person : publisher.contact_person;
    publisher.phone = phone !== undefined ? phone : publisher.phone;
    publisher.email = email !== undefined ? email : publisher.email;
    publisher.address = address !== undefined ? address : publisher.address;
    publisher.credit_days = credit_days !== undefined ? Number(credit_days) : publisher.credit_days;
    publisher.status = status || publisher.status;

    createLog(db, "Publisher", "Update", publisher.publisher_number, `Updated publisher ${publisher.publisher_name}`);
    await writeDb(db, ["publishers", "live_logs"]);
    res.json(publisher);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Locations
app.post("/api/locations", async (req, res) => {
  try {
    const db = await readDb();
    const { name, type, city, address, contact_person, phone, status } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Name and Type are required." });
    }

    const prefix = type === "warehouse" ? "WH" : type === "shop" ? "SHOP" : "SCH";
    const code = nextCode(db.locations.filter(l => l.type === type), "code", prefix);

    const newLocation: Location = {
      id: makeId("loc"),
      code,
      name,
      type,
      city,
      address,
      contact_person,
      phone,
      status: status || "active"
    };

    db.locations.push(newLocation);
    createLog(db, "Location", "Create", code, `Created location ${name} (${code})`);
    await writeDb(db, ["locations", "live_logs"]);
    res.status(201).json(newLocation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Locations
app.put("/api/locations/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;
    const { name, type, city, address, contact_person, phone, status } = req.body;

    const location = db.locations.find(l => l.id === id);
    if (!location) {
      return res.status(404).json({ error: "Location not found." });
    }

    location.name = name || location.name;
    location.type = type || location.type;
    location.city = city !== undefined ? city : location.city;
    location.address = address !== undefined ? address : location.address;
    location.contact_person = contact_person !== undefined ? contact_person : location.contact_person;
    location.phone = phone !== undefined ? phone : location.phone;
    location.status = status || location.status;

    createLog(db, "Location", "Update", location.code, `Updated location ${location.name}`);
    await writeDb(db, ["locations", "live_logs"]);
    res.json(location);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Categories Endpoints
app.post("/api/categories", async (req, res) => {
  try {
    const db = await readDb();
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });

    const newCat: Category = {
      id: makeId("cat"),
      name,
      status: status || "active"
    };
    db.categories.push(newCat);
    createLog(db, "Category", "Create", "CAT-NEW", `Created category ${name}`);
    await writeDb(db, ["categories", "live_logs"]);
    res.status(201).json(newCat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;
    const { name, status } = req.body;
    const cat = db.categories.find(c => c.id === id);
    if (!cat) return res.status(404).json({ error: "Category not found." });

    cat.name = name || cat.name;
    cat.status = status || cat.status;
    createLog(db, "Category", "Update", "CAT-UPD", `Updated category ${cat.name}`);
    await writeDb(db, ["categories", "live_logs"]);
    res.json(cat);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Subjects Endpoints
app.post("/api/subjects", async (req, res) => {
  try {
    const db = await readDb();
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });

    const newSub: Subject = {
      id: makeId("sub"),
      name,
      status: status || "active"
    };
    db.subjects.push(newSub);
    createLog(db, "Subject", "Create", "SUB-NEW", `Created subject ${name}`);
    await writeDb(db, ["subjects", "live_logs"]);
    res.status(201).json(newSub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/subjects/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;
    const { name, status } = req.body;
    const sub = db.subjects.find(s => s.id === id);
    if (!sub) return res.status(404).json({ error: "Subject not found." });

    sub.name = name || sub.name;
    sub.status = status || sub.status;
    createLog(db, "Subject", "Update", "SUB-UPD", `Updated subject ${sub.name}`);
    await writeDb(db, ["subjects", "live_logs"]);
    res.json(sub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Classes Endpoints
app.post("/api/classes", async (req, res) => {
  try {
    const db = await readDb();
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });

    const newCls: ClassEntity = {
      id: makeId("cls"),
      name,
      status: status || "active"
    };
    db.classes.push(newCls);
    createLog(db, "Class", "Create", "CLS-NEW", `Created class ${name}`);
    await writeDb(db, ["classes", "live_logs"]);
    res.status(201).json(newCls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/classes/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;
    const { name, status } = req.body;
    const cls = db.classes.find(c => c.id === id);
    if (!cls) return res.status(404).json({ error: "Class not found." });

    cls.name = name || cls.name;
    cls.status = status || cls.status;
    createLog(db, "Class", "Update", "CLS-UPD", `Updated class ${cls.name}`);
    await writeDb(db, ["classes", "live_logs"]);
    res.json(cls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Books (Create with optional Opening Stock)
app.post("/api/books", async (req, res) => {
  try {
    const db = await readDb();
    const {
      title,
      barcode,
      ISBN,
      publisher_id,
      category_id,
      subject_id,
      class_id,
      purchase_cost,
      sale_price,
      reorder_level,
      cover_image,
      status,
      notes,
      opening_stock_qty,
      opening_stock_location_id,
      opening_stock_notes
    } = req.body;

    if (!title || !publisher_id || !category_id || !subject_id || !class_id) {
      return res.status(400).json({ error: "Required fields: Title, Publisher, Category, Subject, and Class." });
    }
    if (!db.publishers.some(p => p.id === publisher_id)) return res.status(404).json({ error: "Publisher not found." });
    if (!db.categories.some(c => c.id === category_id)) return res.status(404).json({ error: "Category not found." });
    if (!db.subjects.some(sub => sub.id === subject_id)) return res.status(404).json({ error: "Subject not found." });
    if (!db.classes.some(cls => cls.id === class_id)) return res.status(404).json({ error: "Class not found." });
    if (opening_stock_qty && opening_stock_location_id && !db.locations.some(l => l.id === opening_stock_location_id)) {
      return res.status(404).json({ error: "Opening stock location not found." });
    }
    if (barcode && db.books.some(b => b.barcode && b.barcode === barcode)) {
      return res.status(400).json({ error: "Another book already uses this barcode." });
    }
    if (ISBN && db.books.some(b => b.ISBN && b.ISBN === ISBN)) {
      return res.status(400).json({ error: "Another book already uses this ISBN." });
    }

    const book_number = nextCode(db.books, "book_number", "BK");
    const newBook: Book = {
      id: makeId("book"),
      book_number,
      title,
      barcode: barcode || undefined,
      ISBN: ISBN || undefined,
      publisher_id,
      category_id,
      subject_id,
      class_id,
      purchase_cost: Number(purchase_cost) || 0,
      sale_price: Number(sale_price) || 0,
      reorder_level: reorder_level !== undefined ? Number(reorder_level) : 20,
      cover_image: cover_image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200",
      status: status || "active",
      notes: notes || undefined,
      created_at: new Date().toISOString()
    };

    db.books.push(newBook);
    createLog(db, "Book", "Create", book_number, `Created book "${title}" (${book_number})`);

    // Handle Opening Stock if provided
    const opQty = Number(opening_stock_qty) || 0;
    if (opQty > 0 && opening_stock_location_id) {
      const entryId = makeId("stk-entry");
      const entry_number = nextCode(db.stock_entries, "entry_number", "ENT");

      const newEntry: StockEntry = {
        id: entryId,
        entry_number,
        date: new Date().toISOString(),
        book_id: newBook.id,
        location_id: opening_stock_location_id,
        quantity: opQty,
        unit_cost: newBook.purchase_cost,
        reference_number: "OPENING",
        notes: opening_stock_notes || "Opening Stock during book registration",
        created_at: new Date().toISOString()
      };
      db.stock_entries.push(newEntry);

      // Update Stock Balance
      const finalBalance = updateStockBalance(db, newBook.id, opening_stock_location_id, opQty);

      // Create Stock History
      const histId = makeId("stk-hist");
      const newHist: StockHistory = {
        id: histId,
        date: new Date().toISOString(),
        book_id: newBook.id,
        location_id: opening_stock_location_id,
        movement_type: "Opening Stock",
        quantity_in: opQty,
        quantity_out: 0,
        balance_after: finalBalance,
        reference_number: "OPENING",
        notes: opening_stock_notes || "Opening Stock",
        created_at: new Date().toISOString()
      };
      db.stock_history.push(newHist);
    }

    await writeDb(db, ["books", "live_logs", "stock_entries", "stock_balances", "stock_history"]);
    res.status(201).json(newBook);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Add Stock
app.post("/api/add-stock", async (req, res) => {
  try {
    const db = await readDb();

    const {
      date,
      publisher_id,
      location_id,
      book_id,
      quantity,
      unit_cost,
      sale_price,
      reference_number,
      notes,
      purchase_type,
      set_name,
      items,
    } = req.body;

    if (!location_id) {
      return res.status(400).json({ error: "Required field: Location." });
    }

    const location = db.locations.find((l) => l.id === location_id);

    if (!location) {
      return res.status(404).json({ error: "Location not found." });
    }

    if (publisher_id) {
      const publisher = db.publishers.find((p) => p.id === publisher_id);

      if (!publisher) {
        return res.status(404).json({ error: "Publisher not found." });
      }
    }

    const stockItems =
      Array.isArray(items) && items.length > 0
        ? items
        : [
            {
              book_id,
              quantity,
              unit_cost,
              sale_price,
            },
          ];

    if (stockItems.length === 0) {
      return res.status(400).json({ error: "Please add at least one book." });
    }

    const createdEntries: StockEntry[] = [];
    const createdHistory: StockHistory[] = [];
    let totalQuantity = 0;
    let salePriceUpdatedCount = 0;

    for (const item of stockItems) {
      const itemBookId = item.book_id;
      const itemQuantity = Number(item.quantity);
      const itemUnitCost = item.unit_cost !== undefined && item.unit_cost !== ""
        ? Number(item.unit_cost)
        : undefined;

      const hasSalePrice =
        item.sale_price !== undefined &&
        item.sale_price !== null &&
        item.sale_price !== "";

      const itemSalePrice = hasSalePrice ? Number(item.sale_price) : undefined;

      if (!itemBookId) {
        return res.status(400).json({ error: "Book is required for every stock item." });
      }

      if (!itemQuantity || itemQuantity <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than 0 for every stock item." });
      }

      if (hasSalePrice && (Number.isNaN(itemSalePrice) || Number(itemSalePrice) < 0)) {
        return res.status(400).json({ error: "Sale price must be 0 or greater when entered." });
      }

      const book = db.books.find((b) => b.id === itemBookId);

      if (!book) {
        return res.status(404).json({ error: "One selected book was not found." });
      }

      if (publisher_id && book.publisher_id !== publisher_id) {
        return res.status(400).json({
          error: `Book "${book.title}" does not belong to the selected publisher.`,
        });
      }

      if (hasSalePrice && itemSalePrice !== undefined && !Number.isNaN(itemSalePrice)) {
        book.sale_price = itemSalePrice;
        salePriceUpdatedCount += 1;
      }

      const entryNumber = nextCode(db.stock_entries, "entry_number", "ENT");

      const finalNotes = [
        notes || "",
        purchase_type === "set" || purchase_type === "pair" || purchase_type === "bundle"
          ? `Set/Pair: ${set_name || "Unnamed Set"}`
          : "",
        hasSalePrice && itemSalePrice !== undefined && !Number.isNaN(itemSalePrice)
          ? `Sale Price Updated: ${itemSalePrice}`
          : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const newEntry: StockEntry = {
        id: makeId("stk-entry"),
        entry_number: entryNumber,
        date: date || new Date().toISOString(),
        book_id: itemBookId,
        location_id,
        quantity: itemQuantity,
        unit_cost:
          itemUnitCost !== undefined && !Number.isNaN(itemUnitCost)
            ? itemUnitCost
            : book.purchase_cost,
        reference_number: reference_number || undefined,
        notes: finalNotes || undefined,
        created_at: new Date().toISOString(),
      };

      db.stock_entries.push(newEntry);

      const finalBalance = updateStockBalance(db, itemBookId, location_id, itemQuantity);

      const newHist: StockHistory = {
        id: makeId("stk-hist"),
        date: date || new Date().toISOString(),
        book_id: itemBookId,
        location_id,
        movement_type: "Add Stock",
        quantity_in: itemQuantity,
        quantity_out: 0,
        balance_after: finalBalance,
        reference_number: reference_number || undefined,
        notes: finalNotes || undefined,
        created_at: new Date().toISOString(),
      };

      db.stock_history.push(newHist);

      createdEntries.push(newEntry);
      createdHistory.push(newHist);
      totalQuantity += itemQuantity;
    }

    const logReference = reference_number || createdEntries[0]?.entry_number || "STOCK-ADD";

    createLog(
      db,
      "Stock",
      "Add",
      logReference,
      purchase_type === "set" || purchase_type === "pair" || purchase_type === "bundle"
        ? `Added ${totalQuantity} total units from set/pair "${set_name || "Unnamed Set"}"${
            salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""
          }`
        : `Added ${totalQuantity} total stock units${
            salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""
          }`
    );

    await writeDb(db, ["books", "stock_entries", "stock_balances", "stock_history", "live_logs"]);

    res.status(201).json({
      message: "Stock added successfully.",
      entries: createdEntries,
      history: createdHistory,
      total_quantity: totalQuantity,
      sale_price_updated_count: salePriceUpdatedCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Sales
app.post("/api/sales", async (req, res) => {
  try {
    const db = await readDb();
    const { date, location_id, customer_name, book_id, quantity, sale_price, discount, payment_method, notes } = req.body;

    if (!location_id || !book_id || !quantity || !sale_price) {
      return res.status(400).json({ error: "Required fields: Selling Location, Book, Quantity, and Sale Price." });
    }

    const qty = Number(quantity);
    const available = getStockBalance(db, book_id, location_id);

    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }

    const book = db.books.find(b => b.id === book_id);
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }

    const price = Number(sale_price);
    const disc = Number(discount) || 0;
    const totalAmount = (price * qty) - disc;

    const sale_number = nextPlainCode(db.sales, "sale_number", "SL");

    const newSale: Sale = {
      id: makeId("sale"),
      sale_number,
      date: date || new Date().toISOString(),
      location_id,
      customer_name: customer_name || undefined,
      payment_method: payment_method || "Cash",
      notes: notes || undefined,
      created_at: new Date().toISOString(),
      total_amount: totalAmount,
      discount: disc
    };

    const newSaleItem: SaleItem = {
      id: makeId("sitem"),
      sale_id: newSale.id,
      book_id,
      quantity: qty,
      unit_price: price,
      discount: disc,
      line_total: totalAmount
    };

    db.sales.push(newSale);
    db.sale_items.push(newSaleItem);

    // Reduce stock
    const finalBalance = updateStockBalance(db, book_id, location_id, -qty);

    // Create stock history entry
    const newHist: StockHistory = {
      id: makeId("stk-hist"),
      date: date || new Date().toISOString(),
      book_id,
      location_id,
      movement_type: "Sale",
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalBalance,
      reference_number: sale_number,
      notes: `Sale to ${customer_name || "Walk-in Customer"}`,
      created_at: new Date().toISOString()
    };
    db.stock_history.push(newHist);

    createLog(db, "Sales", "Sale", sale_number, `Sold ${qty} units of "${book.title}" for total ${totalAmount}`);
    await writeDb(db, ["sales", "sale_items", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newSale);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Customer Returns
app.post("/api/customer-returns", async (req, res) => {
  try {
    const db = await readDb();
    const { date, original_sale_number, customer_name, book_id, location_id, quantity, reason, notes } = req.body;

    if (!book_id || !location_id || !quantity || !reason) {
      return res.status(400).json({ error: "Required fields: Book, Location, Quantity, and Reason." });
    }

    const qty = Number(quantity);
    const book = db.books.find(b => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });

    const return_number = nextPlainCode(db.customer_returns, "return_number", "RET");

    const newReturn: CustomerReturn = {
      id: makeId("cret"),
      return_number,
      date: date || new Date().toISOString(),
      customer_name: customer_name || undefined,
      original_sale_number: original_sale_number || undefined,
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: notes || undefined,
      created_at: new Date().toISOString()
    };

    db.customer_returns.push(newReturn);

    // Increase stock
    const finalBalance = updateStockBalance(db, book_id, location_id, qty);

    // Create Stock History
    const newHist: StockHistory = {
      id: makeId("stk-hist"),
      date: date || new Date().toISOString(),
      book_id,
      location_id,
      movement_type: "Customer Return",
      quantity_in: qty,
      quantity_out: 0,
      balance_after: finalBalance,
      reference_number: return_number,
      notes: `Customer Return: ${reason}`,
      created_at: new Date().toISOString()
    };
    db.stock_history.push(newHist);

    createLog(db, "Returns", "Customer Return", return_number, `Received return of ${qty} units of "${book.title}"`);
    await writeDb(db, ["customer_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Publisher Returns
app.post("/api/publisher-returns", async (req, res) => {
  try {
    const db = await readDb();
    const { date, publisher_id, book_id, location_id, quantity, reason, notes } = req.body;

    if (!publisher_id || !book_id || !location_id || !quantity || !reason) {
      return res.status(400).json({ error: "Required fields: Publisher, Book, Location, Quantity, and Reason." });
    }

    const qty = Number(quantity);
    const available = getStockBalance(db, book_id, location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }

    const book = db.books.find(b => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });

    const return_number = nextPlainCode(db.publisher_returns, "return_number", "PRT");

    const newReturn: PublisherReturn = {
      id: makeId("pret"),
      return_number,
      date: date || new Date().toISOString(),
      publisher_id,
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: notes || undefined,
      created_at: new Date().toISOString()
    };

    db.publisher_returns.push(newReturn);

    // Reduce stock
    const finalBalance = updateStockBalance(db, book_id, location_id, -qty);

    // Create Stock History
    const newHist: StockHistory = {
      id: makeId("stk-hist"),
      date: date || new Date().toISOString(),
      book_id,
      location_id,
      movement_type: "Return to Publisher",
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalBalance,
      reference_number: return_number,
      notes: `Publisher Return: ${reason}`,
      created_at: new Date().toISOString()
    };
    db.stock_history.push(newHist);

    createLog(db, "Returns", "Publisher Return", return_number, `Returned ${qty} units of "${book.title}" to publisher`);
    await writeDb(db, ["publisher_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Stock Transfers
app.post("/api/stock-transfers", async (req, res) => {
  try {
    const db = await readDb();
    const { date, from_location_id, to_location_id, book_id, quantity, notes } = req.body;

    if (!from_location_id || !to_location_id || !book_id || !quantity) {
      return res.status(400).json({ error: "Required fields: From Location, To Location, Book, and Quantity." });
    }

    if (from_location_id === to_location_id) {
      return res.status(400).json({ error: "Source and destination locations cannot be the same." });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0." });
    }

    const available = getStockBalance(db, book_id, from_location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Source location only has ${available} units.` });
    }

    const book = db.books.find(b => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });

    const transfer_number = nextPlainCode(db.stock_transfers, "transfer_number", "TRN");

    const newTransfer: StockTransfer = {
      id: makeId("trn"),
      transfer_number,
      date: date || new Date().toISOString(),
      from_location_id,
      to_location_id,
      book_id,
      quantity: qty,
      notes: notes || undefined,
      created_at: new Date().toISOString()
    };

    db.stock_transfers.push(newTransfer);

    // Reduce stock from source
    const finalSourceBalance = updateStockBalance(db, book_id, from_location_id, -qty);

    // Increase stock at destination
    const finalDestBalance = updateStockBalance(db, book_id, to_location_id, qty);

    // Create TWO stock histories
    db.stock_history.push({
      id: makeId("stk-hist"),
      date: date || new Date().toISOString(),
      book_id,
      location_id: from_location_id,
      movement_type: "Transfer Out",
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalSourceBalance,
      reference_number: transfer_number,
      notes: `Transferred to ${db.locations.find(l => l.id === to_location_id)?.name || "another location"}`,
      created_at: new Date().toISOString()
    });

    db.stock_history.push({
      id: makeId("stk-hist"),
      date: date || new Date().toISOString(),
      book_id,
      location_id: to_location_id,
      movement_type: "Transfer In",
      quantity_in: qty,
      quantity_out: 0,
      balance_after: finalDestBalance,
      reference_number: transfer_number,
      notes: `Transferred from ${db.locations.find(l => l.id === from_location_id)?.name || "another location"}`,
      created_at: new Date().toISOString()
    });

    createLog(db, "Transfers", "Transfer", transfer_number, `Transferred ${qty} units of "${book.title}"`);
    await writeDb(db, ["stock_transfers", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newTransfer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Damage / Loss
app.post("/api/damage-loss", async (req, res) => {
  try {
    const db = await readDb();
    const { date, book_id, location_id, quantity, reason, notes } = req.body;

    if (!book_id || !location_id || !quantity || !reason) {
      return res.status(400).json({ error: "Required fields: Book, Location, Quantity, and Reason." });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0." });
    }

    const available = getStockBalance(db, book_id, location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }

    const book = db.books.find(b => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });

    const newRecord: DamageLossRecord = {
      id: makeId("dmg"),
      date: date || new Date().toISOString(),
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: notes || undefined,
      created_at: new Date().toISOString()
    };

    db.damage_loss_records.push(newRecord);

    // Reduce stock
    const finalBalance = updateStockBalance(db, book_id, location_id, -qty);

    // Create Stock History Entry
    const movement_type = reason === "Damage" ? "Damage" : reason === "Loss" ? "Loss" : "Correction";
    const newHist: StockHistory = {
      id: makeId("stk-hist"),
      date: date || new Date().toISOString(),
      book_id,
      location_id,
      movement_type: movement_type as any,
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalBalance,
      reference_number: "DMG-LOSS",
      notes: `Damage/Loss: ${reason}. Notes: ${notes || ""}`,
      created_at: new Date().toISOString()
    };
    db.stock_history.push(newHist);

    createLog(db, "Damage/Loss", "Correction", "DMG-LOSS", `Logged ${reason} for ${qty} units of "${book.title}"`);
    await writeDb(db, ["damage_loss_records", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newRecord);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Smart Entry - creates optional master data, book, opening stock, history, and logs in one save call.
app.post("/api/smart-entry", async (req, res) => {
  try {
    const db = await readDb();
    const {
      publisher_id,
      publisher_name,
      publisher_phone,
      publisher_credit_days,
      subject_id,
      subject_name,
      category_id,
      category_name,
      class_id,
      class_name,
      title,
      barcode,
      ISBN,
      purchase_cost,
      sale_price,
      reorder_level,
      stock_date,
      location_id,
      stock_quantity,
      stock_reference_number,
      stock_notes
    } = req.body;

    if (!title || !location_id || !stock_quantity) {
      return res.status(400).json({ error: "Required fields: Book title, stock location, and stock quantity." });
    }

    const qty = Number(stock_quantity);
    if (qty <= 0) {
      return res.status(400).json({ error: "Stock quantity must be greater than 0." });
    }
    if (!db.locations.some(l => l.id === location_id)) {
      return res.status(404).json({ error: "Stock location not found." });
    }
    if (barcode && db.books.some(b => b.barcode && b.barcode === barcode)) {
      return res.status(400).json({ error: "Another book already uses this barcode." });
    }
    if (ISBN && db.books.some(b => b.ISBN && b.ISBN === ISBN)) {
      return res.status(400).json({ error: "Another book already uses this ISBN." });
    }

    let finalPublisherId = publisher_id as string | undefined;
    let finalSubjectId = subject_id as string | undefined;
    let finalCategoryId = category_id as string | undefined;
    let finalClassId = class_id as string | undefined;
    const created: string[] = [];

    if (!finalPublisherId) {
      if (!publisher_name) return res.status(400).json({ error: "Publisher is required." });
      const publisher_number = nextCode(db.publishers, "publisher_number", "PUB");
      const publisher: Publisher = {
        id: makeId("pub"),
        publisher_number,
        publisher_name,
        phone: publisher_phone || undefined,
        credit_days: Number(publisher_credit_days) || 30,
        status: "active",
        created_at: new Date().toISOString()
      };
      db.publishers.push(publisher);
      finalPublisherId = publisher.id;
      created.push(`Publisher: ${publisher.publisher_name}`);
      createLog(db, "Publisher", "Create", publisher_number, `Created publisher ${publisher.publisher_name} (${publisher_number})`);
    } else if (!db.publishers.some(p => p.id === finalPublisherId)) {
      return res.status(404).json({ error: "Publisher not found." });
    }

    if (!finalSubjectId) {
      if (!subject_name) return res.status(400).json({ error: "Subject is required." });
      const subject: Subject = { id: makeId("sub"), name: subject_name, status: "active" };
      db.subjects.push(subject);
      finalSubjectId = subject.id;
      created.push(`Subject: ${subject.name}`);
      createLog(db, "Subject", "Create", "SUB-NEW", `Created subject ${subject.name}`);
    } else if (!db.subjects.some(s => s.id === finalSubjectId)) {
      return res.status(404).json({ error: "Subject not found." });
    }

    if (!finalCategoryId) {
      if (!category_name) return res.status(400).json({ error: "Category is required." });
      const category: Category = { id: makeId("cat"), name: category_name, status: "active" };
      db.categories.push(category);
      finalCategoryId = category.id;
      created.push(`Category: ${category.name}`);
      createLog(db, "Category", "Create", "CAT-NEW", `Created category ${category.name}`);
    } else if (!db.categories.some(c => c.id === finalCategoryId)) {
      return res.status(404).json({ error: "Category not found." });
    }

    if (!finalClassId) {
      if (!class_name) return res.status(400).json({ error: "Class is required." });
      const classRecord: ClassEntity = { id: makeId("cls"), name: class_name, status: "active" };
      db.classes.push(classRecord);
      finalClassId = classRecord.id;
      created.push(`Class: ${classRecord.name}`);
      createLog(db, "Class", "Create", "CLS-NEW", `Created class ${classRecord.name}`);
    } else if (!db.classes.some(c => c.id === finalClassId)) {
      return res.status(404).json({ error: "Class not found." });
    }

    const book_number = nextCode(db.books, "book_number", "BK");
    const book: Book = {
      id: makeId("book"),
      book_number,
      title,
      barcode: barcode || undefined,
      ISBN: ISBN || undefined,
      publisher_id: finalPublisherId,
      category_id: finalCategoryId,
      subject_id: finalSubjectId,
      class_id: finalClassId,
      purchase_cost: Number(purchase_cost) || 0,
      sale_price: Number(sale_price) || 0,
      reorder_level: reorder_level !== undefined ? Number(reorder_level) : DEFAULT_SETTINGS.globalReorderLevel,
      cover_image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200",
      status: "active",
      created_at: new Date().toISOString()
    };
    db.books.push(book);
    created.push(`Book: ${book.title}`);
    createLog(db, "Book", "Create", book_number, `Created book "${book.title}" (${book_number})`);

    const entry_number = nextCode(db.stock_entries, "entry_number", "ENT");
    const stockEntry: StockEntry = {
      id: makeId("stk-entry"),
      entry_number,
      date: stock_date || new Date().toISOString(),
      book_id: book.id,
      location_id,
      quantity: qty,
      unit_cost: Number(purchase_cost) || 0,
      reference_number: stock_reference_number || "SMART-ENTRY",
      notes: stock_notes || `Smart-entry stock received for ${book.title}`,
      created_at: new Date().toISOString()
    };
    db.stock_entries.push(stockEntry);

    const finalBalance = updateStockBalance(db, book.id, location_id, qty);
    db.stock_history.push({
      id: makeId("stk-hist"),
      date: stock_date || new Date().toISOString(),
      book_id: book.id,
      location_id,
      movement_type: "Opening Stock",
      quantity_in: qty,
      quantity_out: 0,
      balance_after: finalBalance,
      reference_number: entry_number,
      notes: stock_notes || "Smart Entry Opening Stock",
      created_at: new Date().toISOString()
    });
    created.push(`Received stock: ${qty} units`);
    createLog(db, "Smart Entry", "Create", entry_number, `Smart entry completed for "${book.title}" with ${qty} units`);

    await writeDb(db, [
      "publishers",
      "subjects",
      "categories",
      "classes",
      "books",
      "stock_entries",
      "stock_balances",
      "stock_history",
      "live_logs"
    ]);

    res.status(201).json({ book, stockEntry, created });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT Books
app.put("/api/books/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;
    const {
      title,
      barcode,
      ISBN,
      publisher_id,
      category_id,
      subject_id,
      class_id,
      purchase_cost,
      sale_price,
      reorder_level,
      cover_image,
      status,
      notes
    } = req.body;

    const book = db.books.find(b => b.id === id);
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }
    if (publisher_id && !db.publishers.some(p => p.id === publisher_id)) return res.status(404).json({ error: "Publisher not found." });
    if (category_id && !db.categories.some(c => c.id === category_id)) return res.status(404).json({ error: "Category not found." });
    if (subject_id && !db.subjects.some(sub => sub.id === subject_id)) return res.status(404).json({ error: "Subject not found." });
    if (class_id && !db.classes.some(cls => cls.id === class_id)) return res.status(404).json({ error: "Class not found." });
    if (barcode && db.books.some(b => b.id !== id && b.barcode && b.barcode === barcode)) return res.status(400).json({ error: "Another book already uses this barcode." });
    if (ISBN && db.books.some(b => b.id !== id && b.ISBN && b.ISBN === ISBN)) return res.status(400).json({ error: "Another book already uses this ISBN." });

    book.title = title || book.title;
    book.barcode = barcode !== undefined ? barcode : book.barcode;
    book.ISBN = ISBN !== undefined ? ISBN : book.ISBN;
    book.publisher_id = publisher_id || book.publisher_id;
    book.category_id = category_id || book.category_id;
    book.subject_id = subject_id || book.subject_id;
    book.class_id = class_id || book.class_id;
    book.purchase_cost = purchase_cost !== undefined ? Number(purchase_cost) : book.purchase_cost;
    book.sale_price = sale_price !== undefined ? Number(sale_price) : book.sale_price;
    book.reorder_level = reorder_level !== undefined ? Number(reorder_level) : book.reorder_level;
    book.cover_image = cover_image !== undefined ? cover_image : book.cover_image;
    book.status = status || book.status;
    book.notes = notes !== undefined ? notes : book.notes;

    createLog(db, "Book", "Update", book.book_number, `Updated book "${book.title}"`);
    await writeDb(db, ["books", "live_logs"]);
    res.json(book);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Books
app.delete("/api/books/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;

    const bookIndex = db.books.findIndex(b => b.id === id);
    if (bookIndex === -1) {
      return res.status(404).json({ error: "Book not found." });
    }

    const book = db.books[bookIndex];

    // Check if used in transactions
    const hasHistory = db.stock_history.some(h => h.book_id === id);
    const hasSales = db.sale_items.some(s => s.book_id === id);
    const hasCustReturns = db.customer_returns.some(r => r.book_id === id);
    const hasPubReturns = db.publisher_returns.some(r => r.book_id === id);
    const hasTransfers = db.stock_transfers.some(t => t.book_id === id);
    const hasDamageLoss = db.damage_loss_records.some(d => d.book_id === id);

    if (hasHistory || hasSales || hasCustReturns || hasPubReturns || hasTransfers || hasDamageLoss) {
      return res.status(400).json({ error: "Book has active transactions. Deactivate it instead." });
    }

    db.books.splice(bookIndex, 1);
    createLog(db, "Book", "Delete", book.book_number, `Deleted book "${book.title}"`);
    await writeDb(db, ["books", "live_logs"]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Publishers
app.delete("/api/publishers/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;

    const pubIndex = db.publishers.findIndex(p => p.id === id);
    if (pubIndex === -1) {
      return res.status(404).json({ error: "Publisher not found." });
    }

    const publisher = db.publishers[pubIndex];

    // Check if referenced in books or publisher returns
    const hasBooks = db.books.some(b => b.publisher_id === id);
    const hasReturns = db.publisher_returns.some(r => r.publisher_id === id);

    if (hasBooks || hasReturns) {
      return res.status(400).json({ error: "Publisher is linked to existing books/returns. Deactivate it instead." });
    }

    db.publishers.splice(pubIndex, 1);
    createLog(db, "Publisher", "Delete", publisher.publisher_number, `Deleted publisher "${publisher.publisher_name}"`);
    await writeDb(db, ["publishers", "live_logs"]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Locations
app.delete("/api/locations/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;

    const locIndex = db.locations.findIndex(l => l.id === id);
    if (locIndex === -1) {
      return res.status(404).json({ error: "Location not found." });
    }

    const location = db.locations[locIndex];

    // Check if location has stock balances or transactions
    const hasStock = db.stock_balances.some(b => b.location_id === id && b.quantity > 0);
    const hasHistory = db.stock_history.some(h => h.location_id === id);
    const hasSales = db.sales.some(s => s.location_id === id);
    const hasCustReturns = db.customer_returns.some(r => r.location_id === id);
    const hasPubReturns = db.publisher_returns.some(r => r.location_id === id);
    const hasTransfers = db.stock_transfers.some(t => t.from_location_id === id || t.to_location_id === id);
    const hasDamageLoss = db.damage_loss_records.some(d => d.location_id === id);

    if (hasStock || hasHistory || hasSales || hasCustReturns || hasPubReturns || hasTransfers || hasDamageLoss) {
      return res.status(400).json({ error: "Location has active stock or historical transactions. Deactivate it instead." });
    }

    db.locations.splice(locIndex, 1);
    createLog(db, "Location", "Delete", location.code, `Deleted location "${location.name}"`);
    await writeDb(db, ["locations", "live_logs"]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Categories
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;

    const catIndex = db.categories.findIndex(c => c.id === id);
    if (catIndex === -1) {
      return res.status(404).json({ error: "Category not found." });
    }

    const cat = db.categories[catIndex];

    // Check if referenced by books
    const hasBooks = db.books.some(b => b.category_id === id);
    if (hasBooks) {
      return res.status(400).json({ error: "Category has books assigned to it. Deactivate it instead." });
    }

    db.categories.splice(catIndex, 1);
    createLog(db, "Category", "Delete", "CAT-DEL", `Deleted category "${cat.name}"`);
    await writeDb(db, ["categories", "live_logs"]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Subjects
app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;

    const subIndex = db.subjects.findIndex(s => s.id === id);
    if (subIndex === -1) {
      return res.status(404).json({ error: "Subject not found." });
    }

    const sub = db.subjects[subIndex];

    // Check if referenced by books
    const hasBooks = db.books.some(b => b.subject_id === id);
    if (hasBooks) {
      return res.status(400).json({ error: "Subject has books assigned to it. Deactivate it instead." });
    }

    db.subjects.splice(subIndex, 1);
    createLog(db, "Subject", "Delete", "SUB-DEL", `Deleted subject "${sub.name}"`);
    await writeDb(db, ["subjects", "live_logs"]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Classes
app.delete("/api/classes/:id", async (req, res) => {
  try {
    const db = await readDb();
    const { id } = req.params;

    const clsIndex = db.classes.findIndex(c => c.id === id);
    if (clsIndex === -1) {
      return res.status(404).json({ error: "Class not found." });
    }

    const cls = db.classes[clsIndex];

    // Check if referenced by books
    const hasBooks = db.books.some(b => b.class_id === id);
    if (hasBooks) {
      return res.status(400).json({ error: "Class has books assigned to it. Deactivate it instead." });
    }

    db.classes.splice(clsIndex, 1);
    createLog(db, "Class", "Delete", "CLS-DEL", `Deleted class "${cls.name}"`);
    await writeDb(db, ["classes", "live_logs"]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (!req.path.startsWith("/api")) {
    return next(error);
  }

  const message =
    process.env.NODE_ENV === "production"
      ? "The request could not be completed."
      : error?.message || "The request could not be completed.";

  return res.status(error?.status || 500).json({ error: message });
});

// Local development and traditional Node production startup.
// On Vercel, api/index.ts imports and exports this Express app instead.
async function startLocalServer() {
  await ensureAuthStoreInitialized();

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
      }),
    );

    app.use(
      express.static(distPath, {
        maxAge: "1h",
      }),
    );

    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

const isVercelRuntime = Boolean(process.env.VERCEL);

if (!isVercelRuntime) {
  void startLocalServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  });
}

export { app };
export default app;
