import "dotenv/config";
import express from "express";
import helmet from "helmet";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { DatabaseSchema, Publisher, Location, Category, Subject, ClassEntity, Book, StockEntry, StockBalance, StockHistory, Sale, SaleItem, CustomerReturn, PublisherReturn, StockTransfer, DamageLossRecord, LiveLog } from "./src/types";
import { db, pool } from "./src/db/index.ts";
import { 
  publishers, locations, categories, subjects, classes, books, 
  stock_entries, stock_balances, stock_history, sales, sale_items,
  customer_returns, publisher_returns, stock_transfers, damage_loss_records, live_logs 
} from "./src/db/schema.ts";
import { authRouter, usersRouter } from "./server/auth/routes.ts";
import { initializeAuthStore } from "./server/auth/store.ts";
import { requireAuth } from "./server/auth/middleware.ts";
import { authorizeBusinessApi } from "./server/auth/authorization.ts";
import { getCurrentActorEmail, requestContextMiddleware } from "./server/auth/requestContext.ts";

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
    await ensureApplicationStoresInitialized();
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

interface BusinessSettings {
  businessName: string;
  currency: string;
  taxRate: number;
  globalReorderLevel: number;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: "Junaid Books Management System",
  currency: "PKR",
  taxRate: 0,
  globalReorderLevel: 20
};

let writeQueue: Promise<void> = Promise.resolve();
let businessInitializationPromise: Promise<void> | null = null;
const dbSnapshots = new WeakMap<DatabaseSchema, DatabaseSchema>();

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function sendError(res: express.Response, error: any): void {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  const databaseCode = String(error?.code || "");
  if (databaseCode === "23505") {
    res.status(409).json({
      error: "A record with the same unique value already exists. Refresh and try again.",
    });
    return;
  }
  if (databaseCode === "23503") {
    res.status(409).json({
      error: "This record is linked to other data and cannot be changed or deleted.",
    });
    return;
  }
  if (databaseCode === "23514" || databaseCode === "22P02" || databaseCode === "22003") {
    res.status(400).json({ error: "One or more entered values are invalid." });
    return;
  }

  console.error(error);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "The request could not be completed. Please try again."
        : error?.message || "The request could not be completed.",
  });
}

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

function cloneDb(data: DatabaseSchema): DatabaseSchema {
  return normalizeDb(JSON.parse(JSON.stringify(data)));
}

function canonicalRow(row: Record<string, any> | undefined): string {
  if (!row) return "";

  const normalized = Object.fromEntries(
    Object.entries(row)
      .filter(([, value]) => value !== undefined)
      .sort(([left], [right]) => left.localeCompare(right)),
  );

  return JSON.stringify(normalized);
}

function valuesWithoutId(row: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => key !== "id")
      .map(([key, value]) => [key, value === undefined ? null : value]),
  );
}

async function readJsonDb(): Promise<DatabaseSchema> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const database = normalizeDb(JSON.parse(raw));
    assertDatabaseIntegrity(database);
    return database;
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return normalizeDb(EMPTY_DB);
    }

    throw error;
  }
}

async function writeJsonDb(data: DatabaseSchema): Promise<void> {
  const tmpPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(normalizeDb(data), null, 2));
  await fs.rename(tmpPath, DB_PATH);
}

async function ensureBusinessStoreInitialized(): Promise<void> {
  if (USE_LOCAL_DATABASE) return;

  if (!businessInitializationPromise) {
    businessInitializationPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          id text PRIMARY KEY,
          value jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `);

      const safetyStatements = [
        `CREATE UNIQUE INDEX IF NOT EXISTS publishers_name_unique_ci ON publishers (lower(trim(publisher_name)))`,
        `CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique_ci ON categories (lower(trim(name)))`,
        `CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_unique_ci ON subjects (lower(trim(name)))`,
        `CREATE UNIQUE INDEX IF NOT EXISTS classes_name_unique_ci ON classes (lower(trim(name)))`,
        `CREATE UNIQUE INDEX IF NOT EXISTS locations_name_type_unique_ci ON locations (lower(trim(name)), type)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS stock_balances_book_location_unique ON stock_balances (book_id, location_id)`,
      ];

      for (const statement of safetyStatements) {
        try {
          await pool.query(statement);
        } catch (error) {
          console.warn("A database safety index could not be created. Existing duplicate data may need cleanup.", error);
        }
      }
    })().catch((error) => {
      businessInitializationPromise = null;
      throw error;
    });
  }

  await businessInitializationPromise;
}

export async function ensureApplicationStoresInitialized(): Promise<void> {
  await Promise.all([
    ensureAuthStoreInitialized(),
    ensureBusinessStoreInitialized(),
  ]);
}

function sanitizeSettings(settings: Partial<BusinessSettings>): BusinessSettings {
  const taxRate = Number(settings.taxRate);
  const globalReorderLevel = Number(settings.globalReorderLevel);

  return {
    businessName: String(settings.businessName || DEFAULT_SETTINGS.businessName).trim(),
    currency: String(settings.currency || DEFAULT_SETTINGS.currency).trim().toUpperCase(),
    taxRate: Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : DEFAULT_SETTINGS.taxRate,
    globalReorderLevel:
      Number.isFinite(globalReorderLevel) && globalReorderLevel >= 0
        ? Math.floor(globalReorderLevel)
        : DEFAULT_SETTINGS.globalReorderLevel,
  };
}

async function readSettings(): Promise<BusinessSettings> {
  if (USE_LOCAL_DATABASE) {
    try {
      const raw = await fs.readFile(SETTINGS_PATH, "utf8");
      return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        return { ...DEFAULT_SETTINGS };
      }

      throw error;
    }
  }

  await ensureBusinessStoreInitialized();
  const result = await pool.query<{ value: Partial<BusinessSettings> }>(
    `SELECT value FROM app_settings WHERE id = $1 LIMIT 1`,
    ["business"],
  );

  return sanitizeSettings({ ...DEFAULT_SETTINGS, ...(result.rows[0]?.value || {}) });
}

async function writeSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
  const safeSettings = sanitizeSettings(settings);

  if (USE_LOCAL_DATABASE) {
    const tmpPath = `${SETTINGS_PATH}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(safeSettings, null, 2));
    await fs.rename(tmpPath, SETTINGS_PATH);
    return safeSettings;
  }

  await ensureBusinessStoreInitialized();
  await pool.query(
    `
      INSERT INTO app_settings (id, value, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (id)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `,
    ["business", JSON.stringify(safeSettings)],
  );

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
  if (!found) throw new ApiError(404, message);
  return found;
}

function hasDuplicateName<T extends { id: string; name?: string; publisher_name?: string }>(
  items: T[],
  name: string,
  excludedId?: string,
): boolean {
  const normalized = name.trim().toLocaleLowerCase();
  return items.some((item) => {
    const itemName = String(item.name ?? item.publisher_name ?? "").trim().toLocaleLowerCase();
    return item.id !== excludedId && itemName === normalized;
  });
}

function requirePositiveInteger(value: unknown, label: string): number {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(400, `${label} must be a whole number greater than 0.`);
  }
  return number;
}

function requireNonNegativeNumber(value: unknown, label: string, fallback?: number): number {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) {
    return fallback;
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ApiError(400, `${label} must be 0 or greater.`);
  }
  return number;
}

function requireNonNegativeInteger(value: unknown, label: string, fallback?: number): number {
  const number = requireNonNegativeNumber(value, label, fallback);
  if (!Number.isInteger(number)) {
    throw new ApiError(400, `${label} must be a whole number.`);
  }
  return number;
}

function cleanOptionalText(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return text || undefined;
}


function assertUniqueValues<T>(
  rows: T[],
  getValue: (row: T) => string | undefined,
  label: string,
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    const raw = getValue(row);
    if (!raw) continue;
    const value = raw.trim().toLocaleLowerCase();
    if (!value) continue;
    if (seen.has(value)) {
      throw new ApiError(409, `Duplicate ${label} detected in the database: ${raw}`);
    }
    seen.add(value);
  }
}

function assertDatabaseIntegrity(database: DatabaseSchema): void {
  const tableEntries = Object.entries(database) as [string, Array<{ id: string } & Record<string, any>>][];
  for (const [tableName, rows] of tableEntries) {
    assertUniqueValues(rows, (row) => String(row.id || ""), `${tableName} ID`);
  }

  assertUniqueValues(database.publishers, (row) => row.publisher_number, "publisher number");
  assertUniqueValues(database.publishers, (row) => row.publisher_name, "publisher name");
  assertUniqueValues(database.locations, (row) => row.code, "location code");
  assertUniqueValues(database.locations, (row) => `${row.type}:${row.name}`, "location name/type");
  assertUniqueValues(database.categories, (row) => row.name, "category name");
  assertUniqueValues(database.subjects, (row) => row.name, "subject name");
  assertUniqueValues(database.classes, (row) => row.name, "class name");
  assertUniqueValues(database.books, (row) => row.book_number, "book number");
  assertUniqueValues(database.books, (row) => row.barcode, "barcode");
  assertUniqueValues(database.books, (row) => row.ISBN, "ISBN");
  assertUniqueValues(database.stock_entries, (row) => row.entry_number, "stock entry number");
  assertUniqueValues(database.stock_balances, (row) => `${row.book_id}:${row.location_id}`, "book/location stock balance");
  assertUniqueValues(database.sales, (row) => row.sale_number, "sale number");
  assertUniqueValues(database.customer_returns, (row) => row.return_number, "customer return number");
  assertUniqueValues(database.publisher_returns, (row) => row.return_number, "publisher return number");
  assertUniqueValues(database.stock_transfers, (row) => row.transfer_number, "transfer number");

  const publishersById = new Set(database.publishers.map((row) => row.id));
  const locationsById = new Set(database.locations.map((row) => row.id));
  const categoriesById = new Set(database.categories.map((row) => row.id));
  const subjectsById = new Set(database.subjects.map((row) => row.id));
  const classesById = new Set(database.classes.map((row) => row.id));
  const booksById = new Set(database.books.map((row) => row.id));
  const salesById = new Set(database.sales.map((row) => row.id));

  for (const book of database.books) {
    if (!publishersById.has(book.publisher_id) || !categoriesById.has(book.category_id) ||
        !subjectsById.has(book.subject_id) || !classesById.has(book.class_id)) {
      throw new ApiError(409, `Book ${book.book_number} is linked to missing master data.`);
    }
    if (book.purchase_cost < 0 || book.sale_price < 0 || book.reorder_level < 0) {
      throw new ApiError(409, `Book ${book.book_number} has invalid numeric values.`);
    }
  }

  for (const entry of database.stock_entries) {
    if (!booksById.has(entry.book_id) || !locationsById.has(entry.location_id) ||
        !Number.isInteger(entry.quantity) || entry.quantity <= 0 || entry.unit_cost < 0) {
      throw new ApiError(409, `Stock entry ${entry.entry_number} is invalid.`);
    }
  }
  for (const balance of database.stock_balances) {
    if (!booksById.has(balance.book_id) || !locationsById.has(balance.location_id) ||
        !Number.isInteger(balance.quantity) || balance.quantity < 0) {
      throw new ApiError(409, "A stock balance record is invalid.");
    }
  }
  for (const history of database.stock_history) {
    if (!booksById.has(history.book_id) || !locationsById.has(history.location_id) ||
        !Number.isInteger(history.quantity_in) || history.quantity_in < 0 ||
        !Number.isInteger(history.quantity_out) || history.quantity_out < 0 ||
        !Number.isInteger(history.balance_after) || history.balance_after < 0) {
      throw new ApiError(409, "A stock history record is invalid.");
    }
  }
  for (const sale of database.sales) {
    if (!locationsById.has(sale.location_id) || sale.total_amount < 0 || sale.discount < 0) {
      throw new ApiError(409, `Sale ${sale.sale_number} is invalid.`);
    }
  }
  for (const item of database.sale_items) {
    if (!salesById.has(item.sale_id) || !booksById.has(item.book_id) ||
        !Number.isInteger(item.quantity) || item.quantity <= 0 || item.unit_price < 0 ||
        item.discount < 0 || item.line_total < 0) {
      throw new ApiError(409, "A sale item record is invalid.");
    }
  }

  const validateBookLocationQuantity = (rows: Array<{ book_id: string; location_id: string; quantity: number }>, label: string) => {
    for (const row of rows) {
      if (!booksById.has(row.book_id) || !locationsById.has(row.location_id) ||
          !Number.isInteger(row.quantity) || row.quantity <= 0) {
        throw new ApiError(409, `A ${label} record is invalid.`);
      }
    }
  };
  validateBookLocationQuantity(database.customer_returns, "customer return");
  validateBookLocationQuantity(database.publisher_returns, "publisher return");
  validateBookLocationQuantity(database.damage_loss_records, "damage/loss");

  for (const row of database.publisher_returns) {
    if (!publishersById.has(row.publisher_id)) throw new ApiError(409, "A publisher return is linked to a missing publisher.");
  }
  for (const row of database.stock_transfers) {
    if (!booksById.has(row.book_id) || !locationsById.has(row.from_location_id) ||
        !locationsById.has(row.to_location_id) || row.from_location_id === row.to_location_id ||
        !Number.isInteger(row.quantity) || row.quantity <= 0) {
      throw new ApiError(409, `Transfer ${row.transfer_number} is invalid.`);
    }
  }
}

// PostgreSQL is read fresh for every request. Local JSON mode also returns a new object,
// so one failed request can never leak partial in-memory mutations into another request.
async function readDb(_forceRefresh = false): Promise<DatabaseSchema> {
  let result: DatabaseSchema;

  if (USE_LOCAL_DATABASE) {
    result = await readJsonDb();
  } else {
    await ensureBusinessStoreInitialized();

    const [
      pubs, locs, cats, subs, clss, bks, entries, balances, hist, sls,
      sitems, crets, prets, transfers, dmgs, logs,
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

    result = normalizeDb({
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
      live_logs: logs as LiveLog[],
    });
  }

  assertDatabaseIntegrity(result);
  dbSnapshots.set(result, cloneDb(result));
  return result;
}

// Saves only records changed by the current request. It never clears a whole table.
// PostgreSQL writes are atomic, and optimistic checks prevent stale requests from
// silently overwriting stock or records changed by another user.
async function writeDb(data: DatabaseSchema, tablesToSync?: string[]): Promise<void> {
  const snapshot = dbSnapshots.get(data);

  if (!snapshot) {
    throw new ApiError(500, "Database write context is missing. Please refresh and try again.");
  }

  const runWrite = async () => {
    if (USE_LOCAL_DATABASE) {
      const current = await readJsonDb();
      const list = tablesToSync || Object.keys(current);

      for (const tableName of list) {
        const beforeRows = ((snapshot as any)[tableName] || []) as Record<string, any>[];
        const afterRows = ((data as any)[tableName] || []) as Record<string, any>[];
        const currentRows = ((current as any)[tableName] || []) as Record<string, any>[];
        const beforeById = new Map(beforeRows.map((row) => [row.id, row]));
        const afterById = new Map(afterRows.map((row) => [row.id, row]));
        const currentById = new Map(currentRows.map((row) => [row.id, row]));

        const insertedRows = afterRows.filter((row) => !beforeById.has(row.id));
        const updatedRows = afterRows.filter((row) => {
          const before = beforeById.get(row.id);
          return before && canonicalRow(before) !== canonicalRow(row);
        });
        const deletedRows = beforeRows.filter((row) => !afterById.has(row.id));

        for (const row of updatedRows) {
          const before = beforeById.get(row.id)!;
          const currentRow = currentById.get(row.id);
          if (!currentRow || canonicalRow(currentRow) !== canonicalRow(before)) {
            throw new ApiError(
              409,
              "This record was changed by another user. Refresh the page and try again.",
            );
          }
          currentById.set(row.id, row);
        }

        for (const row of deletedRows) {
          const currentRow = currentById.get(row.id);
          if (!currentRow) continue;
          if (canonicalRow(currentRow) !== canonicalRow(row)) {
            throw new ApiError(
              409,
              "This record was changed by another user. Refresh the page and try again.",
            );
          }
          currentById.delete(row.id);
        }

        for (const row of insertedRows) {
          if (currentById.has(row.id)) {
            throw new ApiError(409, "A record with this ID already exists. Refresh and try again.");
          }
          currentById.set(row.id, row);
        }

        (current as any)[tableName] = Array.from(currentById.values());
        if (tableName === "live_logs") {
          current.live_logs.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
        }
      }

      assertDatabaseIntegrity(current);
      await writeJsonDb(current);
      dbSnapshots.delete(data);
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

    await db.transaction(async (tx) => {
      for (const tableName of list) {
        const table = tablesMap[tableName];
        if (!table) continue;

        const beforeRows = ((snapshot as any)[tableName] || []) as Record<string, any>[];
        const afterRows = ((data as any)[tableName] || []) as Record<string, any>[];
        const beforeById = new Map(beforeRows.map((row) => [row.id, row]));
        const afterById = new Map(afterRows.map((row) => [row.id, row]));

        const insertedRows = afterRows.filter((row) => !beforeById.has(row.id));
        const updatedRows = afterRows.filter((row) => {
          const before = beforeById.get(row.id);
          return before && canonicalRow(before) !== canonicalRow(row);
        });
        const deletedRows = beforeRows.filter((row) => !afterById.has(row.id));

        for (const row of insertedRows) {
          await tx.insert(table).values(row);
        }

        for (const row of updatedRows) {
          const before = beforeById.get(row.id)!;
          const currentRows = await tx.select().from(table).where(eq(table.id, row.id)).limit(1);
          const current = currentRows[0] as Record<string, any> | undefined;

          if (!current || canonicalRow(current) !== canonicalRow(before)) {
            throw new ApiError(
              409,
              "This record was changed by another user. Refresh the page and try again.",
            );
          }

          await tx.update(table).set(valuesWithoutId(row)).where(eq(table.id, row.id));
        }

        for (const row of deletedRows) {
          const currentRows = await tx.select().from(table).where(eq(table.id, row.id)).limit(1);
          const current = currentRows[0] as Record<string, any> | undefined;

          if (!current) continue;
          if (canonicalRow(current) !== canonicalRow(row)) {
            throw new ApiError(
              409,
              "This record was changed by another user. Refresh the page and try again.",
            );
          }

          await tx.delete(table).where(eq(table.id, row.id));
        }
      }
    });

    dbSnapshots.delete(data);
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
    sendError(res, error);
  }
});

app.get("/api/settings", async (_req, res) => {
  try {
    res.json(await readSettings());
  } catch (error: any) {
    sendError(res, error);
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const saved = await writeSettings(req.body);
    res.json(saved);
  } catch (error: any) {
    sendError(res, error);
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

  if (!Number.isInteger(qtyDiff)) {
    throw new ApiError(400, "Stock quantity changes must be whole numbers.");
  }

  const nextQuantity = balance.quantity + qtyDiff;
  if (nextQuantity < 0) {
    throw new ApiError(400, `Insufficient stock. Current balance is ${balance.quantity}.`);
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
    const database = await readDb();
    const publisherName = String(req.body.publisher_name || "").trim();

    if (!publisherName) {
      return res.status(400).json({ error: "Publisher Name is required." });
    }
    if (hasDuplicateName(database.publishers, publisherName)) {
      return res.status(409).json({ error: "A publisher with this name already exists." });
    }

    const creditDays = Number(req.body.credit_days);
    const publisherNumber = nextCode(database.publishers, "publisher_number", "PUB");
    const newPublisher: Publisher = {
      id: makeId("pub"),
      publisher_number: publisherNumber,
      publisher_name: publisherName,
      contact_person: String(req.body.contact_person || "").trim() || undefined,
      phone: String(req.body.phone || "").trim() || undefined,
      email: String(req.body.email || "").trim() || undefined,
      address: String(req.body.address || "").trim() || undefined,
      credit_days: Number.isFinite(creditDays) && creditDays >= 0 ? Math.floor(creditDays) : 30,
      status: req.body.status === "inactive" ? "inactive" : "active",
      created_at: new Date().toISOString(),
    };

    database.publishers.push(newPublisher);
    createLog(database, "Publisher", "Create", publisherNumber, `Created publisher ${publisherName} (${publisherNumber})`);
    await writeDb(database, ["publishers", "live_logs"]);
    res.status(201).json(newPublisher);
  } catch (error: any) {
    sendError(res, error);
  }
});

// PUT Publishers
app.put("/api/publishers/:id", async (req, res) => {
  try {
    const database = await readDb();
    const publisher = database.publishers.find((item) => item.id === req.params.id);
    if (!publisher) return res.status(404).json({ error: "Publisher not found." });

    const publisherName = String(req.body.publisher_name ?? publisher.publisher_name).trim();
    if (!publisherName) return res.status(400).json({ error: "Publisher Name is required." });
    if (hasDuplicateName(database.publishers, publisherName, publisher.id)) {
      return res.status(409).json({ error: "A publisher with this name already exists." });
    }

    const creditDays = req.body.credit_days !== undefined ? Number(req.body.credit_days) : publisher.credit_days;
    if (!Number.isFinite(creditDays) || creditDays < 0) {
      return res.status(400).json({ error: "Credit days must be 0 or greater." });
    }

    publisher.publisher_name = publisherName;
    publisher.contact_person = req.body.contact_person !== undefined ? String(req.body.contact_person).trim() || undefined : publisher.contact_person;
    publisher.phone = req.body.phone !== undefined ? String(req.body.phone).trim() || undefined : publisher.phone;
    publisher.email = req.body.email !== undefined ? String(req.body.email).trim() || undefined : publisher.email;
    publisher.address = req.body.address !== undefined ? String(req.body.address).trim() || undefined : publisher.address;
    publisher.credit_days = Math.floor(creditDays);
    publisher.status = req.body.status === "inactive" ? "inactive" : "active";

    createLog(database, "Publisher", "Update", publisher.publisher_number, `Updated publisher ${publisher.publisher_name}`);
    await writeDb(database, ["publishers", "live_logs"]);
    res.json(publisher);
  } catch (error: any) {
    sendError(res, error);
  }
});

// POST Locations
app.post("/api/locations", async (req, res) => {
  try {
    const database = await readDb();
    const name = String(req.body.name || "").trim();
    const type = String(req.body.type || "").toLowerCase();

    if (!name || !["warehouse", "shop", "school"].includes(type)) {
      return res.status(400).json({ error: "A valid Name and Type are required." });
    }
    if (database.locations.some((item) => item.type === type && item.name.trim().toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ error: "A location with this name and type already exists." });
    }

    const prefix = type === "warehouse" ? "WH" : type === "shop" ? "SHOP" : "SCH";
    const code = nextCode(database.locations.filter((item) => item.type === type), "code", prefix);
    const newLocation: Location = {
      id: makeId("loc"),
      code,
      name,
      type: type as Location["type"],
      city: String(req.body.city || "").trim() || undefined,
      address: String(req.body.address || "").trim() || undefined,
      contact_person: String(req.body.contact_person || "").trim() || undefined,
      phone: String(req.body.phone || "").trim() || undefined,
      status: req.body.status === "inactive" ? "inactive" : "active",
    };

    database.locations.push(newLocation);
    createLog(database, "Location", "Create", code, `Created location ${name} (${code})`);
    await writeDb(database, ["locations", "live_logs"]);
    res.status(201).json(newLocation);
  } catch (error: any) {
    sendError(res, error);
  }
});

// PUT Locations
app.put("/api/locations/:id", async (req, res) => {
  try {
    const database = await readDb();
    const location = database.locations.find((item) => item.id === req.params.id);
    if (!location) return res.status(404).json({ error: "Location not found." });

    const name = String(req.body.name ?? location.name).trim();
    const type = String(req.body.type ?? location.type).toLowerCase();
    if (!name || !["warehouse", "shop", "school"].includes(type)) {
      return res.status(400).json({ error: "A valid Name and Type are required." });
    }
    if (database.locations.some((item) => item.id !== location.id && item.type === type && item.name.trim().toLowerCase() === name.toLowerCase())) {
      return res.status(409).json({ error: "A location with this name and type already exists." });
    }

    location.name = name;
    location.type = type as Location["type"];
    location.city = req.body.city !== undefined ? String(req.body.city).trim() || undefined : location.city;
    location.address = req.body.address !== undefined ? String(req.body.address).trim() || undefined : location.address;
    location.contact_person = req.body.contact_person !== undefined ? String(req.body.contact_person).trim() || undefined : location.contact_person;
    location.phone = req.body.phone !== undefined ? String(req.body.phone).trim() || undefined : location.phone;
    location.status = req.body.status === "inactive" ? "inactive" : "active";

    createLog(database, "Location", "Update", location.code, `Updated location ${location.name}`);
    await writeDb(database, ["locations", "live_logs"]);
    res.json(location);
  } catch (error: any) {
    sendError(res, error);
  }
});

function registerSimpleMasterRoutes(
  pathName: "categories" | "subjects" | "classes",
  singularName: "Category" | "Subject" | "Class",
  idPrefix: "cat" | "sub" | "cls",
) {
  app.post(`/api/${pathName}`, async (req, res) => {
    try {
      const database = await readDb();
      const items = database[pathName] as Array<Category | Subject | ClassEntity>;
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ error: `${singularName} name is required.` });
      if (hasDuplicateName(items, name)) {
        return res.status(409).json({ error: `${singularName} already exists.` });
      }

      const record = {
        id: makeId(idPrefix),
        name,
        status: req.body.status === "inactive" ? "inactive" : "active",
      } as Category | Subject | ClassEntity;
      items.push(record);
      createLog(database, singularName, "Create", `${idPrefix.toUpperCase()}-NEW`, `Created ${singularName.toLowerCase()} ${name}`);
      await writeDb(database, [pathName, "live_logs"]);
      res.status(201).json(record);
    } catch (error: any) {
      sendError(res, error);
    }
  });

  app.put(`/api/${pathName}/:id`, async (req, res) => {
    try {
      const database = await readDb();
      const items = database[pathName] as Array<Category | Subject | ClassEntity>;
      const record = items.find((item) => item.id === req.params.id);
      if (!record) return res.status(404).json({ error: `${singularName} not found.` });

      const name = String(req.body.name ?? record.name).trim();
      if (!name) return res.status(400).json({ error: `${singularName} name is required.` });
      if (hasDuplicateName(items, name, record.id)) {
        return res.status(409).json({ error: `${singularName} already exists.` });
      }

      record.name = name;
      record.status = req.body.status === "inactive" ? "inactive" : "active";
      createLog(database, singularName, "Update", `${idPrefix.toUpperCase()}-UPD`, `Updated ${singularName.toLowerCase()} ${record.name}`);
      await writeDb(database, [pathName, "live_logs"]);
      res.json(record);
    } catch (error: any) {
      sendError(res, error);
    }
  });
}

registerSimpleMasterRoutes("categories", "Category", "cat");
registerSimpleMasterRoutes("subjects", "Subject", "sub");
registerSimpleMasterRoutes("classes", "Class", "cls");

// POST Books (Create with optional Opening Stock)
app.post("/api/books", async (req, res) => {
  try {
    const database = await readDb();
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
      opening_stock_notes,
    } = req.body;

    const cleanTitle = String(title || "").trim();
    if (!cleanTitle || !publisher_id || !category_id || !subject_id || !class_id) {
      throw new ApiError(400, "Required fields: Title, Publisher, Category, Subject, and Class.");
    }

    const publisher = ensureExists(database.publishers, (item) => item.id === publisher_id, "Publisher not found.");
    const category = ensureExists(database.categories, (item) => item.id === category_id, "Category not found.");
    const subject = ensureExists(database.subjects, (item) => item.id === subject_id, "Subject not found.");
    const classRecord = ensureExists(database.classes, (item) => item.id === class_id, "Class not found.");

    if ([publisher.status, category.status, subject.status, classRecord.status].some((value) => value !== "active")) {
      throw new ApiError(400, "Publisher, Category, Subject, and Class must all be active.");
    }

    const cleanBarcode = cleanOptionalText(barcode);
    const cleanIsbn = cleanOptionalText(ISBN);
    if (cleanBarcode && database.books.some((book) => book.barcode === cleanBarcode)) {
      throw new ApiError(409, "Another book already uses this barcode.");
    }
    if (cleanIsbn && database.books.some((book) => book.ISBN === cleanIsbn)) {
      throw new ApiError(409, "Another book already uses this ISBN.");
    }

    const purchaseCost = requireNonNegativeNumber(purchase_cost, "Purchase cost", 0);
    const salePrice = requireNonNegativeNumber(sale_price, "Sale price", 0);
    const reorderLevel = requireNonNegativeInteger(reorder_level, "Reorder level", 20);
    const openingQuantity = requireNonNegativeInteger(opening_stock_qty, "Opening stock quantity", 0);

    if (openingQuantity > 0 && !opening_stock_location_id) {
      throw new ApiError(400, "Opening stock location is required when opening quantity is entered.");
    }
    if (opening_stock_location_id) {
      const location = ensureExists(
        database.locations,
        (item) => item.id === opening_stock_location_id,
        "Opening stock location not found.",
      );
      if (location.status !== "active") {
        throw new ApiError(400, "Opening stock location must be active.");
      }
    }

    const bookNumber = nextCode(database.books, "book_number", "BK");
    const now = new Date().toISOString();
    const newBook: Book = {
      id: makeId("book"),
      book_number: bookNumber,
      title: cleanTitle,
      barcode: cleanBarcode,
      ISBN: cleanIsbn,
      publisher_id,
      category_id,
      subject_id,
      class_id,
      purchase_cost: purchaseCost,
      sale_price: salePrice,
      reorder_level: reorderLevel,
      cover_image: cleanOptionalText(cover_image) || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200",
      status: status === "inactive" ? "inactive" : "active",
      notes: cleanOptionalText(notes),
      created_at: now,
    };

    database.books.push(newBook);
    createLog(database, "Book", "Create", bookNumber, `Created book "${cleanTitle}" (${bookNumber})`);

    if (openingQuantity > 0 && opening_stock_location_id) {
      const entryNumber = nextCode(database.stock_entries, "entry_number", "ENT");
      const stockNotes = cleanOptionalText(opening_stock_notes) || "Opening Stock during book registration";
      const newEntry: StockEntry = {
        id: makeId("stk-entry"),
        entry_number: entryNumber,
        date: now,
        book_id: newBook.id,
        location_id: opening_stock_location_id,
        quantity: openingQuantity,
        unit_cost: purchaseCost,
        reference_number: "OPENING",
        notes: stockNotes,
        created_at: now,
      };
      database.stock_entries.push(newEntry);

      const finalBalance = updateStockBalance(database, newBook.id, opening_stock_location_id, openingQuantity);
      database.stock_history.push({
        id: makeId("stk-hist"),
        date: now,
        book_id: newBook.id,
        location_id: opening_stock_location_id,
        movement_type: "Opening Stock",
        quantity_in: openingQuantity,
        quantity_out: 0,
        balance_after: finalBalance,
        reference_number: "OPENING",
        notes: stockNotes,
        created_at: now,
      });
    }

    await writeDb(database, ["books", "live_logs", "stock_entries", "stock_balances", "stock_history"]);
    res.status(201).json(newBook);
  } catch (error: any) {
    sendError(res, error);
  }
});

// POST Add Stock
app.post("/api/add-stock", async (req, res) => {
  try {
    const database = await readDb();
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
      throw new ApiError(400, "Required field: Location.");
    }

    const location = ensureExists(database.locations, (item) => item.id === location_id, "Location not found.");
    if (location.status !== "active") {
      throw new ApiError(400, "Stock can only be added to an active location.");
    }

    if (publisher_id) {
      const publisher = ensureExists(database.publishers, (item) => item.id === publisher_id, "Publisher not found.");
      if (publisher.status !== "active") {
        throw new ApiError(400, "Selected publisher must be active.");
      }
    }

    const rawItems = Array.isArray(items) && items.length > 0
      ? items
      : [{ book_id, quantity, unit_cost, sale_price }];

    if (rawItems.length === 0) {
      throw new ApiError(400, "Please add at least one book.");
    }

    const seenBookIds = new Set<string>();
    const preparedItems = rawItems.map((item: any, index: number) => {
      const itemBookId = String(item?.book_id || "").trim();
      if (!itemBookId) {
        throw new ApiError(400, `Book is required for stock item ${index + 1}.`);
      }
      if (seenBookIds.has(itemBookId)) {
        throw new ApiError(400, "The same book cannot be added twice in one stock entry.");
      }
      seenBookIds.add(itemBookId);

      const book = ensureExists(database.books, (record) => record.id === itemBookId, "One selected book was not found.");
      if (book.status !== "active") {
        throw new ApiError(400, `Book "${book.title}" is inactive.`);
      }
      if (publisher_id && book.publisher_id !== publisher_id) {
        throw new ApiError(400, `Book "${book.title}" does not belong to the selected publisher.`);
      }

      const itemQuantity = requirePositiveInteger(item.quantity, `Quantity for ${book.title}`);
      const itemUnitCost = requireNonNegativeNumber(item.unit_cost, `Unit cost for ${book.title}`, book.purchase_cost);
      const hasSalePrice = item.sale_price !== undefined && item.sale_price !== null && item.sale_price !== "";
      const itemSalePrice = hasSalePrice
        ? requireNonNegativeNumber(item.sale_price, `Sale price for ${book.title}`)
        : undefined;

      return { book, itemBookId, itemQuantity, itemUnitCost, hasSalePrice, itemSalePrice };
    });

    const createdEntries: StockEntry[] = [];
    const createdHistory: StockHistory[] = [];
    let totalQuantity = 0;
    let salePriceUpdatedCount = 0;
    const now = new Date().toISOString();
    const movementDate = cleanOptionalText(date) || now;
    const cleanReference = cleanOptionalText(reference_number);
    const cleanNotes = cleanOptionalText(notes);
    const cleanSetName = cleanOptionalText(set_name) || "Unnamed Set";
    const isGroupedPurchase = ["set", "pair", "bundle"].includes(String(purchase_type || "").toLowerCase());

    for (const item of preparedItems) {
      if (item.hasSalePrice && item.itemSalePrice !== undefined) {
        item.book.sale_price = item.itemSalePrice;
        salePriceUpdatedCount += 1;
      }

      const entryNumber = nextCode(database.stock_entries, "entry_number", "ENT");
      const finalNotes = [
        cleanNotes,
        isGroupedPurchase ? `Set/Pair: ${cleanSetName}` : undefined,
        item.hasSalePrice && item.itemSalePrice !== undefined
          ? `Sale Price Updated: ${item.itemSalePrice}`
          : undefined,
      ].filter(Boolean).join(" | ");

      const newEntry: StockEntry = {
        id: makeId("stk-entry"),
        entry_number: entryNumber,
        date: movementDate,
        book_id: item.itemBookId,
        location_id,
        quantity: item.itemQuantity,
        unit_cost: item.itemUnitCost,
        reference_number: cleanReference,
        notes: finalNotes || undefined,
        created_at: now,
      };
      database.stock_entries.push(newEntry);

      const finalBalance = updateStockBalance(database, item.itemBookId, location_id, item.itemQuantity);
      const newHistory: StockHistory = {
        id: makeId("stk-hist"),
        date: movementDate,
        book_id: item.itemBookId,
        location_id,
        movement_type: "Add Stock",
        quantity_in: item.itemQuantity,
        quantity_out: 0,
        balance_after: finalBalance,
        reference_number: cleanReference || entryNumber,
        notes: finalNotes || undefined,
        created_at: now,
      };
      database.stock_history.push(newHistory);

      createdEntries.push(newEntry);
      createdHistory.push(newHistory);
      totalQuantity += item.itemQuantity;
    }

    const logReference = cleanReference || createdEntries[0]?.entry_number || "STOCK-ADD";
    createLog(
      database,
      "Stock",
      "Add",
      logReference,
      isGroupedPurchase
        ? `Added ${totalQuantity} total units from set/pair "${cleanSetName}"${
            salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""
          }`
        : `Added ${totalQuantity} total stock units${
            salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""
          }`,
    );

    await writeDb(database, ["books", "stock_entries", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json({
      message: "Stock added successfully.",
      entries: createdEntries,
      history: createdHistory,
      total_quantity: totalQuantity,
      sale_price_updated_count: salePriceUpdatedCount,
    });
  } catch (error: any) {
    sendError(res, error);
  }
});

// POST Sales. Accepts a single item or an atomic multi-book grade-set sale.
app.post("/api/sales", async (req, res) => {
  try {
    const database = await readDb();
    const locationId = String(req.body.location_id || "");
    if (!locationId || !database.locations.some((item) => item.id === locationId && item.status === "active")) {
      return res.status(400).json({ error: "A valid active selling location is required." });
    }

    const submittedItems = Array.isArray(req.body.items) && req.body.items.length > 0
      ? req.body.items
      : [{ book_id: req.body.book_id, quantity: req.body.quantity, sale_price: req.body.sale_price }];

    const combined = new Map<string, { book_id: string; quantity: number; sale_price: number }>();
    for (const submitted of submittedItems) {
      const bookId = String(submitted.book_id || "");
      const quantity = Number(submitted.quantity);
      const salePrice = Number(submitted.sale_price);
      if (!bookId || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(salePrice) || salePrice < 0) {
        return res.status(400).json({ error: "Every sale item requires a book, a positive whole quantity, and a valid sale price." });
      }

      const existing = combined.get(bookId);
      if (existing) {
        existing.quantity += quantity;
        existing.sale_price = salePrice;
      } else {
        combined.set(bookId, { book_id: bookId, quantity, sale_price: salePrice });
      }
    }

    const items = [...combined.values()];
    let subtotal = 0;
    const validatedItems = items.map((item) => {
      const book = database.books.find((record) => record.id === item.book_id && record.status === "active");
      if (!book) throw new ApiError(404, "One selected book was not found or is inactive.");

      const available = getStockBalance(database, item.book_id, locationId);
      if (item.quantity > available) {
        throw new ApiError(400, `Insufficient stock for \"${book.title}\". Only ${available} unit(s) are available.`);
      }

      const gross = item.quantity * item.sale_price;
      subtotal += gross;
      return { ...item, book, gross };
    });

    const discount = Number(req.body.discount) || 0;
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      return res.status(400).json({ error: "Discount must be between 0 and the sale subtotal." });
    }

    const paymentMethod = ["Cash", "Bank", "Credit"].includes(req.body.payment_method)
      ? req.body.payment_method
      : "Cash";
    const saleNumber = nextPlainCode(database.sales, "sale_number", "SL");
    const totalAmount = subtotal - discount;
    const newSale: Sale = {
      id: makeId("sale"),
      sale_number: saleNumber,
      date: req.body.date || new Date().toISOString(),
      location_id: locationId,
      customer_name: String(req.body.customer_name || "").trim() || undefined,
      payment_method: paymentMethod,
      notes: String(req.body.notes || "").trim() || undefined,
      created_at: new Date().toISOString(),
      total_amount: totalAmount,
      discount,
    };

    database.sales.push(newSale);
    let allocatedDiscount = 0;
    const createdItems: SaleItem[] = [];

    validatedItems.forEach((item, index) => {
      const itemDiscount = index === validatedItems.length - 1
        ? discount - allocatedDiscount
        : subtotal > 0
          ? Number(((item.gross / subtotal) * discount).toFixed(2))
          : 0;
      allocatedDiscount += itemDiscount;

      const saleItem: SaleItem = {
        id: makeId("sitem"),
        sale_id: newSale.id,
        book_id: item.book_id,
        quantity: item.quantity,
        unit_price: item.sale_price,
        discount: itemDiscount,
        line_total: item.gross - itemDiscount,
      };
      createdItems.push(saleItem);
      database.sale_items.push(saleItem);

      const finalBalance = updateStockBalance(database, item.book_id, locationId, -item.quantity);
      database.stock_history.push({
        id: makeId("stk-hist"),
        date: newSale.date,
        book_id: item.book_id,
        location_id: locationId,
        movement_type: "Sale",
        quantity_in: 0,
        quantity_out: item.quantity,
        balance_after: finalBalance,
        reference_number: saleNumber,
        notes: `Sale to ${newSale.customer_name || "Walk-in Customer"}`,
        created_at: new Date().toISOString(),
      });
    });

    const totalUnits = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
    createLog(database, "Sales", "Sale", saleNumber, `Sold ${totalUnits} unit(s) across ${createdItems.length} book(s) for total ${totalAmount}`);
    await writeDb(database, ["sales", "sale_items", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json({ ...newSale, items: createdItems });
  } catch (error: any) {
    sendError(res, error);
  }
});

// POST Customer Returns
app.post("/api/customer-returns", async (req, res) => {
  try {
    const database = await readDb();
    const bookId = String(req.body.book_id || "");
    const locationId = String(req.body.location_id || "");
    const reason = String(req.body.reason || "").trim();
    const quantity = Number(req.body.quantity);

    if (!bookId || !locationId || !reason || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Book, Location, positive whole Quantity, and Reason are required." });
    }

    const book = database.books.find((item) => item.id === bookId);
    if (!book) return res.status(404).json({ error: "Book not found." });
    if (book.status !== "active") throw new ApiError(400, "Selected book is inactive.");
    const returnLocation = database.locations.find((item) => item.id === locationId);
    if (!returnLocation) return res.status(404).json({ error: "Location not found." });
    if (returnLocation.status !== "active") throw new ApiError(400, "Return location must be active.");

    const originalSaleNumber = String(req.body.original_sale_number || "").trim();
    if (!originalSaleNumber) {
      throw new ApiError(400, "Original sale number is required for a customer return.");
    }
    {
      const originalSale = database.sales.find((sale) => sale.sale_number.toLowerCase() === originalSaleNumber.toLowerCase());
      if (!originalSale) return res.status(404).json({ error: "Original sale number was not found." });
      if (originalSale.location_id !== locationId) {
        return res.status(400).json({ error: "Return location must match the original sale location." });
      }

      const soldQuantity = database.sale_items
        .filter((item) => item.sale_id === originalSale.id && item.book_id === bookId)
        .reduce((sum, item) => sum + Number(item.quantity), 0);
      if (soldQuantity <= 0) {
        return res.status(400).json({ error: "The selected book is not part of the original sale." });
      }

      const alreadyReturned = database.customer_returns
        .filter((item) => item.original_sale_number?.toLowerCase() === originalSale.sale_number.toLowerCase() && item.book_id === bookId && item.location_id === locationId)
        .reduce((sum, item) => sum + Number(item.quantity), 0);
      if (alreadyReturned + quantity > soldQuantity) {
        return res.status(400).json({ error: `Only ${Math.max(0, soldQuantity - alreadyReturned)} unit(s) remain returnable for this sale.` });
      }
    }

    const returnNumber = nextPlainCode(database.customer_returns, "return_number", "RET");
    const newReturn: CustomerReturn = {
      id: makeId("cret"),
      return_number: returnNumber,
      date: req.body.date || new Date().toISOString(),
      customer_name: String(req.body.customer_name || "").trim() || undefined,
      original_sale_number: originalSaleNumber || undefined,
      book_id: bookId,
      location_id: locationId,
      quantity,
      reason,
      notes: String(req.body.notes || "").trim() || undefined,
      created_at: new Date().toISOString(),
    };

    database.customer_returns.push(newReturn);
    const finalBalance = updateStockBalance(database, bookId, locationId, quantity);
    database.stock_history.push({
      id: makeId("stk-hist"),
      date: newReturn.date,
      book_id: bookId,
      location_id: locationId,
      movement_type: "Customer Return",
      quantity_in: quantity,
      quantity_out: 0,
      balance_after: finalBalance,
      reference_number: returnNumber,
      notes: `Customer Return: ${reason}`,
      created_at: new Date().toISOString(),
    });

    createLog(database, "Returns", "Customer Return", returnNumber, `Received return of ${quantity} unit(s) of \"${book.title}\"`);
    await writeDb(database, ["customer_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error: any) {
    sendError(res, error);
  }
});

// POST Publisher Returns
app.post("/api/publisher-returns", async (req, res) => {
  try {
    const database = await readDb();
    const publisherId = String(req.body.publisher_id || "");
    const bookId = String(req.body.book_id || "");
    const locationId = String(req.body.location_id || "");
    const reason = String(req.body.reason || "").trim();
    const quantity = Number(req.body.quantity);

    if (!publisherId || !bookId || !locationId || !reason || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Publisher, Book, Location, positive whole Quantity, and Reason are required." });
    }

    const publisher = database.publishers.find((item) => item.id === publisherId);
    const book = database.books.find((item) => item.id === bookId);
    if (!publisher) return res.status(404).json({ error: "Publisher not found." });
    if (publisher.status !== "active") throw new ApiError(400, "Selected publisher is inactive.");
    if (!book) return res.status(404).json({ error: "Book not found." });
    if (book.status !== "active") throw new ApiError(400, "Selected book is inactive.");
    if (book.publisher_id !== publisherId) {
      return res.status(400).json({ error: `\"${book.title}\" does not belong to the selected publisher.` });
    }
    const returnLocation = database.locations.find((item) => item.id === locationId);
    if (!returnLocation) return res.status(404).json({ error: "Location not found." });
    if (returnLocation.status !== "active") throw new ApiError(400, "Return location must be active.");

    const available = getStockBalance(database, bookId, locationId);
    if (quantity > available) {
      return res.status(400).json({ error: `Insufficient stock. Only ${available} unit(s) are available.` });
    }

    const returnNumber = nextPlainCode(database.publisher_returns, "return_number", "PRT");
    const newReturn: PublisherReturn = {
      id: makeId("pret"),
      return_number: returnNumber,
      date: req.body.date || new Date().toISOString(),
      publisher_id: publisherId,
      book_id: bookId,
      location_id: locationId,
      quantity,
      reason,
      notes: String(req.body.notes || "").trim() || undefined,
      created_at: new Date().toISOString(),
    };

    database.publisher_returns.push(newReturn);
    const finalBalance = updateStockBalance(database, bookId, locationId, -quantity);
    database.stock_history.push({
      id: makeId("stk-hist"),
      date: newReturn.date,
      book_id: bookId,
      location_id: locationId,
      movement_type: "Return to Publisher",
      quantity_in: 0,
      quantity_out: quantity,
      balance_after: finalBalance,
      reference_number: returnNumber,
      notes: `Publisher Return: ${reason}`,
      created_at: new Date().toISOString(),
    });

    createLog(database, "Returns", "Publisher Return", returnNumber, `Returned ${quantity} unit(s) of \"${book.title}\" to ${publisher.publisher_name}`);
    await writeDb(database, ["publisher_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error: any) {
    sendError(res, error);
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
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive whole number." });
    }

    const sourceLocation = db.locations.find((location) => location.id === from_location_id);
    const destinationLocation = db.locations.find((location) => location.id === to_location_id);
    if (!sourceLocation) return res.status(404).json({ error: "Source location not found." });
    if (!destinationLocation) return res.status(404).json({ error: "Destination location not found." });
    if (sourceLocation.status !== "active" || destinationLocation.status !== "active") {
      throw new ApiError(400, "Source and destination locations must both be active.");
    }

    const available = getStockBalance(db, book_id, from_location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Source location only has ${available} units.` });
    }

    const book = db.books.find(b => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    if (book.status !== "active") throw new ApiError(400, "Selected book is inactive.");

    const transfer_number = nextPlainCode(db.stock_transfers, "transfer_number", "TRN");

    const newTransfer: StockTransfer = {
      id: makeId("trn"),
      transfer_number,
      date: date || new Date().toISOString(),
      from_location_id,
      to_location_id,
      book_id,
      quantity: qty,
      notes: cleanOptionalText(notes),
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
    sendError(res, error);
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
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive whole number." });
    }
    if (!["Damage", "Loss", "Free Sample", "Other"].includes(reason)) {
      return res.status(400).json({ error: "A valid damage/loss reason is required." });
    }
    const damageLocation = db.locations.find((location) => location.id === location_id);
    if (!damageLocation) return res.status(404).json({ error: "Location not found." });
    if (damageLocation.status !== "active") throw new ApiError(400, "Selected location is inactive.");

    const available = getStockBalance(db, book_id, location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }

    const book = db.books.find(b => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    if (book.status !== "active") throw new ApiError(400, "Selected book is inactive.");

    const newRecord: DamageLossRecord = {
      id: makeId("dmg"),
      date: date || new Date().toISOString(),
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: cleanOptionalText(notes),
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
    sendError(res, error);
  }
});

// POST Smart Entry - creates optional master data, book, opening stock, history, and logs in one save call.
app.post("/api/smart-entry", async (req, res) => {
  try {
    const database = await readDb();
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
      stock_notes,
    } = req.body;

    const cleanTitle = String(title || "").trim();
    if (!cleanTitle || !location_id) {
      throw new ApiError(400, "Required fields: Book title, stock location, and stock quantity.");
    }

    const quantity = requirePositiveInteger(stock_quantity, "Stock quantity");
    const purchaseCost = requireNonNegativeNumber(purchase_cost, "Purchase cost", 0);
    const salePrice = requireNonNegativeNumber(sale_price, "Sale price", 0);
    const reorderLevel = requireNonNegativeInteger(
      reorder_level,
      "Reorder level",
      DEFAULT_SETTINGS.globalReorderLevel,
    );
    const publisherCreditDays = requireNonNegativeInteger(publisher_credit_days, "Publisher credit days", 30);

    const location = ensureExists(database.locations, (item) => item.id === location_id, "Stock location not found.");
    if (location.status !== "active") {
      throw new ApiError(400, "Stock location must be active.");
    }

    const cleanBarcode = cleanOptionalText(barcode);
    const cleanIsbn = cleanOptionalText(ISBN);
    if (cleanBarcode && database.books.some((book) => book.barcode === cleanBarcode)) {
      throw new ApiError(409, "Another book already uses this barcode.");
    }
    if (cleanIsbn && database.books.some((book) => book.ISBN === cleanIsbn)) {
      throw new ApiError(409, "Another book already uses this ISBN.");
    }

    const created: string[] = [];
    const now = new Date().toISOString();

    const resolvePublisher = (): string => {
      if (publisher_id) {
        const record = ensureExists(database.publishers, (item) => item.id === publisher_id, "Publisher not found.");
        if (record.status !== "active") throw new ApiError(400, "Selected publisher is inactive.");
        return record.id;
      }

      const name = String(publisher_name || "").trim();
      if (!name) throw new ApiError(400, "Publisher is required.");
      const existing = database.publishers.find(
        (item) => item.publisher_name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
      );
      if (existing) {
        if (existing.status !== "active") throw new ApiError(400, "A publisher with this name exists but is inactive.");
        return existing.id;
      }

      const publisherNumber = nextCode(database.publishers, "publisher_number", "PUB");
      const record: Publisher = {
        id: makeId("pub"),
        publisher_number: publisherNumber,
        publisher_name: name,
        phone: cleanOptionalText(publisher_phone),
        credit_days: publisherCreditDays,
        status: "active",
        created_at: now,
      };
      database.publishers.push(record);
      created.push(`Publisher: ${record.publisher_name}`);
      createLog(database, "Publisher", "Create", publisherNumber, `Created publisher ${record.publisher_name} (${publisherNumber})`);
      return record.id;
    };

    const resolveNamedMaster = <T extends Category | Subject | ClassEntity>(
      records: T[],
      selectedId: unknown,
      enteredName: unknown,
      label: "Category" | "Subject" | "Class",
      idPrefix: string,
    ): string => {
      if (selectedId) {
        const record = ensureExists(records, (item) => item.id === selectedId, `${label} not found.`);
        if (record.status !== "active") throw new ApiError(400, `Selected ${label.toLowerCase()} is inactive.`);
        return record.id;
      }

      const name = String(enteredName || "").trim();
      if (!name) throw new ApiError(400, `${label} is required.`);
      const existing = records.find((item) => item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
      if (existing) {
        if (existing.status !== "active") {
          throw new ApiError(400, `A ${label.toLowerCase()} with this name exists but is inactive.`);
        }
        return existing.id;
      }

      const record = { id: makeId(idPrefix), name, status: "active" } as T;
      records.push(record);
      created.push(`${label}: ${record.name}`);
      createLog(database, label, "Create", `${idPrefix.toUpperCase()}-NEW`, `Created ${label.toLowerCase()} ${record.name}`);
      return record.id;
    };

    const finalPublisherId = resolvePublisher();
    const finalSubjectId = resolveNamedMaster(database.subjects, subject_id, subject_name, "Subject", "sub");
    const finalCategoryId = resolveNamedMaster(database.categories, category_id, category_name, "Category", "cat");
    const finalClassId = resolveNamedMaster(database.classes, class_id, class_name, "Class", "cls");

    const bookNumber = nextCode(database.books, "book_number", "BK");
    const book: Book = {
      id: makeId("book"),
      book_number: bookNumber,
      title: cleanTitle,
      barcode: cleanBarcode,
      ISBN: cleanIsbn,
      publisher_id: finalPublisherId,
      category_id: finalCategoryId,
      subject_id: finalSubjectId,
      class_id: finalClassId,
      purchase_cost: purchaseCost,
      sale_price: salePrice,
      reorder_level: reorderLevel,
      cover_image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200",
      status: "active",
      created_at: now,
    };
    database.books.push(book);
    created.push(`Book: ${book.title}`);
    createLog(database, "Book", "Create", bookNumber, `Created book "${book.title}" (${bookNumber})`);

    const entryNumber = nextCode(database.stock_entries, "entry_number", "ENT");
    const movementDate = cleanOptionalText(stock_date) || now;
    const stockReference = cleanOptionalText(stock_reference_number) || "SMART-ENTRY";
    const finalStockNotes = cleanOptionalText(stock_notes) || `Smart-entry stock received for ${book.title}`;
    const stockEntry: StockEntry = {
      id: makeId("stk-entry"),
      entry_number: entryNumber,
      date: movementDate,
      book_id: book.id,
      location_id,
      quantity,
      unit_cost: purchaseCost,
      reference_number: stockReference,
      notes: finalStockNotes,
      created_at: now,
    };
    database.stock_entries.push(stockEntry);

    const finalBalance = updateStockBalance(database, book.id, location_id, quantity);
    database.stock_history.push({
      id: makeId("stk-hist"),
      date: movementDate,
      book_id: book.id,
      location_id,
      movement_type: "Opening Stock",
      quantity_in: quantity,
      quantity_out: 0,
      balance_after: finalBalance,
      reference_number: entryNumber,
      notes: cleanOptionalText(stock_notes) || "Smart Entry Opening Stock",
      created_at: now,
    });
    created.push(`Received stock: ${quantity} units`);
    createLog(database, "Smart Entry", "Create", entryNumber, `Smart entry completed for "${book.title}" with ${quantity} units`);

    await writeDb(database, [
      "publishers",
      "subjects",
      "categories",
      "classes",
      "books",
      "stock_entries",
      "stock_balances",
      "stock_history",
      "live_logs",
    ]);

    res.status(201).json({ book, stockEntry, created });
  } catch (error: any) {
    sendError(res, error);
  }
});

// PUT Books
app.put("/api/books/:id", async (req, res) => {
  try {
    const database = await readDb();
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
      notes,
    } = req.body;

    const book = ensureExists(database.books, (item) => item.id === id, "Book not found.");
    if (title !== undefined && !String(title).trim()) {
      throw new ApiError(400, "Book title is required.");
    }

    if (publisher_id) {
      const record = ensureExists(database.publishers, (item) => item.id === publisher_id, "Publisher not found.");
      if (record.status !== "active") throw new ApiError(400, "Selected publisher is inactive.");
    }
    if (category_id) {
      const record = ensureExists(database.categories, (item) => item.id === category_id, "Category not found.");
      if (record.status !== "active") throw new ApiError(400, "Selected category is inactive.");
    }
    if (subject_id) {
      const record = ensureExists(database.subjects, (item) => item.id === subject_id, "Subject not found.");
      if (record.status !== "active") throw new ApiError(400, "Selected subject is inactive.");
    }
    if (class_id) {
      const record = ensureExists(database.classes, (item) => item.id === class_id, "Class not found.");
      if (record.status !== "active") throw new ApiError(400, "Selected class is inactive.");
    }

    const cleanBarcode = barcode !== undefined ? cleanOptionalText(barcode) : book.barcode;
    const cleanIsbn = ISBN !== undefined ? cleanOptionalText(ISBN) : book.ISBN;
    if (cleanBarcode && database.books.some((item) => item.id !== id && item.barcode === cleanBarcode)) {
      throw new ApiError(409, "Another book already uses this barcode.");
    }
    if (cleanIsbn && database.books.some((item) => item.id !== id && item.ISBN === cleanIsbn)) {
      throw new ApiError(409, "Another book already uses this ISBN.");
    }

    book.title = title !== undefined ? String(title).trim() : book.title;
    book.barcode = cleanBarcode;
    book.ISBN = cleanIsbn;
    book.publisher_id = publisher_id || book.publisher_id;
    book.category_id = category_id || book.category_id;
    book.subject_id = subject_id || book.subject_id;
    book.class_id = class_id || book.class_id;
    book.purchase_cost = purchase_cost !== undefined
      ? requireNonNegativeNumber(purchase_cost, "Purchase cost")
      : book.purchase_cost;
    book.sale_price = sale_price !== undefined
      ? requireNonNegativeNumber(sale_price, "Sale price")
      : book.sale_price;
    book.reorder_level = reorder_level !== undefined
      ? requireNonNegativeInteger(reorder_level, "Reorder level")
      : book.reorder_level;
    book.cover_image = cover_image !== undefined ? cleanOptionalText(cover_image) : book.cover_image;
    book.status = status !== undefined ? (status === "inactive" ? "inactive" : "active") : book.status;
    book.notes = notes !== undefined ? cleanOptionalText(notes) : book.notes;

    createLog(database, "Book", "Update", book.book_number, `Updated book "${book.title}"`);
    await writeDb(database, ["books", "live_logs"]);
    res.json(book);
  } catch (error: any) {
    sendError(res, error);
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
    sendError(res, error);
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
    sendError(res, error);
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
    sendError(res, error);
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
    sendError(res, error);
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
    sendError(res, error);
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
    sendError(res, error);
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
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
  await ensureApplicationStoresInitialized();

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