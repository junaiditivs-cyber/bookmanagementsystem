var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default,
  ensureApplicationStoresInitialized: () => ensureApplicationStoresInitialized,
  ensureAuthStoreInitialized: () => ensureAuthStoreInitialized
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_express2 = __toESM(require("express"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_promises2 = __toESM(require("fs/promises"), 1);
var import_crypto4 = require("crypto");
var import_drizzle_orm = require("drizzle-orm");

// src/db/index.ts
var import_node_postgres = require("drizzle-orm/node-postgres");
var import_pg = __toESM(require("pg"), 1);

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appUsers: () => appUsers,
  authAuditLogs: () => authAuditLogs,
  books: () => books,
  categories: () => categories,
  classes: () => classes,
  customer_returns: () => customer_returns,
  damage_loss_records: () => damage_loss_records,
  live_logs: () => live_logs,
  locations: () => locations,
  publisher_returns: () => publisher_returns,
  publishers: () => publishers,
  sale_items: () => sale_items,
  sales: () => sales,
  stock_balances: () => stock_balances,
  stock_entries: () => stock_entries,
  stock_history: () => stock_history,
  stock_transfers: () => stock_transfers,
  subjects: () => subjects,
  users: () => users
});
var import_pg_core = require("drizzle-orm/pg-core");
var appUsers = (0, import_pg_core.pgTable)(
  "app_users",
  {
    id: (0, import_pg_core.text)("id").primaryKey(),
    name: (0, import_pg_core.text)("name").notNull(),
    email: (0, import_pg_core.text)("email").notNull().unique(),
    passwordHash: (0, import_pg_core.text)("password_hash").notNull(),
    passwordHistory: (0, import_pg_core.jsonb)("password_history").notNull().default([]),
    role: (0, import_pg_core.text)("role").notNull(),
    status: (0, import_pg_core.text)("status").notNull().default("active"),
    mustChangePassword: (0, import_pg_core.boolean)(
      "must_change_password"
    ).notNull().default(true),
    failedLoginAttempts: (0, import_pg_core.integer)(
      "failed_login_attempts"
    ).notNull().default(0),
    lockedUntil: (0, import_pg_core.timestamp)(
      "locked_until",
      {
        withTimezone: true
      }
    ),
    sessionVersion: (0, import_pg_core.integer)("session_version").notNull().default(1),
    lastLoginAt: (0, import_pg_core.timestamp)(
      "last_login_at",
      {
        withTimezone: true
      }
    ),
    passwordChangedAt: (0, import_pg_core.timestamp)(
      "password_changed_at",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    createdAt: (0, import_pg_core.timestamp)(
      "created_at",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    updatedAt: (0, import_pg_core.timestamp)(
      "updated_at",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    createdBy: (0, import_pg_core.text)("created_by"),
    updatedBy: (0, import_pg_core.text)("updated_by")
  }
);
var authAuditLogs = (0, import_pg_core.pgTable)(
  "auth_audit_logs",
  {
    id: (0, import_pg_core.text)("id").primaryKey(),
    timestamp: (0, import_pg_core.timestamp)(
      "timestamp",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    actorUserId: (0, import_pg_core.text)("actor_user_id"),
    actorEmail: (0, import_pg_core.text)("actor_email").notNull(),
    action: (0, import_pg_core.text)("action").notNull(),
    targetUserId: (0, import_pg_core.text)("target_user_id"),
    targetEmail: (0, import_pg_core.text)("target_email"),
    ipAddress: (0, import_pg_core.text)("ip_address"),
    userAgent: (0, import_pg_core.text)("user_agent"),
    result: (0, import_pg_core.text)("result").notNull(),
    details: (0, import_pg_core.text)("details").notNull().default("")
  }
);
var users = appUsers;
var publishers = (0, import_pg_core.pgTable)("publishers", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  publisher_number: (0, import_pg_core.text)("publisher_number").notNull().unique(),
  publisher_name: (0, import_pg_core.text)("publisher_name").notNull(),
  contact_person: (0, import_pg_core.text)("contact_person"),
  phone: (0, import_pg_core.text)("phone"),
  email: (0, import_pg_core.text)("email"),
  address: (0, import_pg_core.text)("address"),
  credit_days: (0, import_pg_core.integer)("credit_days").notNull(),
  status: (0, import_pg_core.text)("status").notNull(),
  notes: (0, import_pg_core.text)("notes"),
  created_at: (0, import_pg_core.text)("created_at").notNull()
});
var locations = (0, import_pg_core.pgTable)("locations", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  code: (0, import_pg_core.text)("code").notNull().unique(),
  name: (0, import_pg_core.text)("name").notNull(),
  type: (0, import_pg_core.text)("type").notNull(),
  city: (0, import_pg_core.text)("city"),
  address: (0, import_pg_core.text)("address"),
  contact_person: (0, import_pg_core.text)("contact_person"),
  phone: (0, import_pg_core.text)("phone"),
  status: (0, import_pg_core.text)("status").notNull()
});
var categories = (0, import_pg_core.pgTable)("categories", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  status: (0, import_pg_core.text)("status").notNull()
});
var subjects = (0, import_pg_core.pgTable)("subjects", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  status: (0, import_pg_core.text)("status").notNull()
});
var classes = (0, import_pg_core.pgTable)("classes", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  status: (0, import_pg_core.text)("status").notNull()
});
var books = (0, import_pg_core.pgTable)("books", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  book_number: (0, import_pg_core.text)("book_number").notNull().unique(),
  title: (0, import_pg_core.text)("title").notNull(),
  barcode: (0, import_pg_core.text)("barcode").unique(),
  ISBN: (0, import_pg_core.text)("ISBN").unique(),
  publisher_id: (0, import_pg_core.text)("publisher_id").notNull().references(
    () => publishers.id
  ),
  category_id: (0, import_pg_core.text)("category_id").notNull().references(
    () => categories.id
  ),
  subject_id: (0, import_pg_core.text)("subject_id").notNull().references(
    () => subjects.id
  ),
  class_id: (0, import_pg_core.text)("class_id").notNull().references(
    () => classes.id
  ),
  purchase_cost: (0, import_pg_core.real)("purchase_cost").notNull(),
  sale_price: (0, import_pg_core.real)("sale_price").notNull(),
  reorder_level: (0, import_pg_core.integer)("reorder_level").notNull(),
  cover_image: (0, import_pg_core.text)("cover_image"),
  status: (0, import_pg_core.text)("status").notNull(),
  notes: (0, import_pg_core.text)("notes"),
  created_at: (0, import_pg_core.text)("created_at").notNull()
});
var stock_entries = (0, import_pg_core.pgTable)("stock_entries", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  entry_number: (0, import_pg_core.text)("entry_number").notNull().unique(),
  date: (0, import_pg_core.text)("date").notNull(),
  book_id: (0, import_pg_core.text)("book_id").notNull().references(
    () => books.id
  ),
  location_id: (0, import_pg_core.text)("location_id").notNull().references(
    () => locations.id
  ),
  quantity: (0, import_pg_core.integer)("quantity").notNull(),
  unit_cost: (0, import_pg_core.real)("unit_cost").notNull(),
  reference_number: (0, import_pg_core.text)("reference_number"),
  notes: (0, import_pg_core.text)("notes"),
  created_at: (0, import_pg_core.text)("created_at").notNull()
});
var stock_balances = (0, import_pg_core.pgTable)("stock_balances", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  book_id: (0, import_pg_core.text)("book_id").notNull().references(
    () => books.id
  ),
  location_id: (0, import_pg_core.text)("location_id").notNull().references(
    () => locations.id
  ),
  quantity: (0, import_pg_core.integer)("quantity").notNull()
});
var stock_history = (0, import_pg_core.pgTable)("stock_history", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  date: (0, import_pg_core.text)("date").notNull(),
  book_id: (0, import_pg_core.text)("book_id").notNull().references(
    () => books.id
  ),
  location_id: (0, import_pg_core.text)("location_id").notNull().references(
    () => locations.id
  ),
  movement_type: (0, import_pg_core.text)("movement_type").notNull(),
  quantity_in: (0, import_pg_core.integer)("quantity_in").notNull(),
  quantity_out: (0, import_pg_core.integer)("quantity_out").notNull(),
  balance_after: (0, import_pg_core.integer)("balance_after").notNull(),
  reference_number: (0, import_pg_core.text)("reference_number"),
  notes: (0, import_pg_core.text)("notes"),
  created_at: (0, import_pg_core.text)("created_at").notNull()
});
var sales = (0, import_pg_core.pgTable)("sales", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  sale_number: (0, import_pg_core.text)("sale_number").notNull().unique(),
  date: (0, import_pg_core.text)("date").notNull(),
  location_id: (0, import_pg_core.text)("location_id").notNull().references(
    () => locations.id
  ),
  customer_name: (0, import_pg_core.text)("customer_name"),
  payment_method: (0, import_pg_core.text)("payment_method").notNull(),
  notes: (0, import_pg_core.text)("notes"),
  created_at: (0, import_pg_core.text)("created_at").notNull(),
  total_amount: (0, import_pg_core.real)("total_amount").notNull(),
  discount: (0, import_pg_core.real)("discount").notNull()
});
var sale_items = (0, import_pg_core.pgTable)("sale_items", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  sale_id: (0, import_pg_core.text)("sale_id").notNull().references(
    () => sales.id
  ),
  book_id: (0, import_pg_core.text)("book_id").notNull().references(
    () => books.id
  ),
  quantity: (0, import_pg_core.integer)("quantity").notNull(),
  unit_price: (0, import_pg_core.real)("unit_price").notNull(),
  discount: (0, import_pg_core.real)("discount").notNull(),
  line_total: (0, import_pg_core.real)("line_total").notNull()
});
var customer_returns = (0, import_pg_core.pgTable)(
  "customer_returns",
  {
    id: (0, import_pg_core.text)("id").primaryKey(),
    return_number: (0, import_pg_core.text)("return_number").notNull().unique(),
    date: (0, import_pg_core.text)("date").notNull(),
    customer_name: (0, import_pg_core.text)("customer_name"),
    original_sale_number: (0, import_pg_core.text)(
      "original_sale_number"
    ),
    book_id: (0, import_pg_core.text)("book_id").notNull().references(
      () => books.id
    ),
    location_id: (0, import_pg_core.text)("location_id").notNull().references(
      () => locations.id
    ),
    quantity: (0, import_pg_core.integer)("quantity").notNull(),
    reason: (0, import_pg_core.text)("reason").notNull(),
    notes: (0, import_pg_core.text)("notes"),
    created_at: (0, import_pg_core.text)("created_at").notNull()
  }
);
var publisher_returns = (0, import_pg_core.pgTable)(
  "publisher_returns",
  {
    id: (0, import_pg_core.text)("id").primaryKey(),
    return_number: (0, import_pg_core.text)("return_number").notNull().unique(),
    date: (0, import_pg_core.text)("date").notNull(),
    publisher_id: (0, import_pg_core.text)("publisher_id").notNull().references(
      () => publishers.id
    ),
    book_id: (0, import_pg_core.text)("book_id").notNull().references(
      () => books.id
    ),
    location_id: (0, import_pg_core.text)("location_id").notNull().references(
      () => locations.id
    ),
    quantity: (0, import_pg_core.integer)("quantity").notNull(),
    reason: (0, import_pg_core.text)("reason").notNull(),
    notes: (0, import_pg_core.text)("notes"),
    created_at: (0, import_pg_core.text)("created_at").notNull()
  }
);
var stock_transfers = (0, import_pg_core.pgTable)(
  "stock_transfers",
  {
    id: (0, import_pg_core.text)("id").primaryKey(),
    transfer_number: (0, import_pg_core.text)("transfer_number").notNull().unique(),
    date: (0, import_pg_core.text)("date").notNull(),
    from_location_id: (0, import_pg_core.text)(
      "from_location_id"
    ).notNull().references(
      () => locations.id
    ),
    to_location_id: (0, import_pg_core.text)(
      "to_location_id"
    ).notNull().references(
      () => locations.id
    ),
    book_id: (0, import_pg_core.text)("book_id").notNull().references(
      () => books.id
    ),
    quantity: (0, import_pg_core.integer)("quantity").notNull(),
    notes: (0, import_pg_core.text)("notes"),
    created_at: (0, import_pg_core.text)("created_at").notNull()
  }
);
var damage_loss_records = (0, import_pg_core.pgTable)(
  "damage_loss_records",
  {
    id: (0, import_pg_core.text)("id").primaryKey(),
    date: (0, import_pg_core.text)("date").notNull(),
    book_id: (0, import_pg_core.text)("book_id").notNull().references(
      () => books.id
    ),
    location_id: (0, import_pg_core.text)("location_id").notNull().references(
      () => locations.id
    ),
    quantity: (0, import_pg_core.integer)("quantity").notNull(),
    reason: (0, import_pg_core.text)("reason").notNull(),
    notes: (0, import_pg_core.text)("notes"),
    created_at: (0, import_pg_core.text)("created_at").notNull()
  }
);
var live_logs = (0, import_pg_core.pgTable)("live_logs", {
  id: (0, import_pg_core.text)("id").primaryKey(),
  timestamp: (0, import_pg_core.text)("timestamp").notNull(),
  user: (0, import_pg_core.text)("user").notNull(),
  module: (0, import_pg_core.text)("module").notNull(),
  action: (0, import_pg_core.text)("action").notNull(),
  record_number: (0, import_pg_core.text)("record_number").notNull(),
  description: (0, import_pg_core.text)("description").notNull(),
  severity: (0, import_pg_core.text)("severity").notNull()
});

// src/db/index.ts
var { Pool } = import_pg.default;
var DATABASE_MODE = (process.env.DATABASE_MODE || "local").toLowerCase();
var connectionString = String(
  process.env.DATABASE_URL || ""
).trim();
if (DATABASE_MODE === "postgres" && !connectionString) {
  throw new Error(
    "DATABASE_URL is required when DATABASE_MODE=postgres."
  );
}
if (connectionString && !/^postgres(?:ql)?:\/\//i.test(
  connectionString
)) {
  throw new Error(
    "DATABASE_URL must be a PostgreSQL connection string beginning with postgres:// or postgresql://."
  );
}
var pool = new Pool(
  connectionString ? {
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 15e3,
    max: 5
  } : {
    connectionTimeoutMillis: 15e3
  }
);
pool.on("error", (error) => {
  console.error(
    "Unexpected error on idle SQL pool client:",
    error
  );
});
var db = (0, import_node_postgres.drizzle)(pool, {
  schema: schema_exports
});

// server/auth/routes.ts
var import_express = require("express");
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_zod = require("zod");

// server/auth/store.ts
var import_promises = __toESM(require("fs/promises"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = require("crypto");
var DATABASE_MODE2 = (process.env.DATABASE_MODE || "local").toLowerCase();
var USE_LOCAL_AUTH_STORE = DATABASE_MODE2 === "local";
var AUTH_DATA_PATH = import_path.default.join(
  process.cwd(),
  "auth-data.json"
);
var EMPTY_AUTH_DATA = {
  users: [],
  audit_logs: []
};
var MAX_AUDIT_LOGS = 5e3;
var localWriteQueue = Promise.resolve();
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
function normalizeLocalData(data = {}) {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    audit_logs: Array.isArray(data.audit_logs) ? data.audit_logs : []
  };
}
async function readLocalData() {
  try {
    const raw = await import_promises.default.readFile(
      AUTH_DATA_PATH,
      "utf8"
    );
    return normalizeLocalData(
      JSON.parse(raw)
    );
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    return normalizeLocalData(
      EMPTY_AUTH_DATA
    );
  }
}
async function writeLocalData(data) {
  const nextData = normalizeLocalData(data);
  nextData.audit_logs = nextData.audit_logs.slice(
    0,
    MAX_AUDIT_LOGS
  );
  const tmpPath = `${AUTH_DATA_PATH}.tmp`;
  await import_promises.default.writeFile(
    tmpPath,
    JSON.stringify(nextData, null, 2),
    {
      mode: 384
    }
  );
  await import_promises.default.rename(
    tmpPath,
    AUTH_DATA_PATH
  );
}
async function withLocalWrite(mutator) {
  let result;
  const runWrite = async () => {
    const data = await readLocalData();
    result = await mutator(data);
    await writeLocalData(data);
  };
  localWriteQueue = localWriteQueue.then(
    runWrite,
    runWrite
  );
  await localWriteQueue;
  return result;
}
function mapPostgresUser(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    password_hash: String(
      row.password_hash
    ),
    password_history: Array.isArray(row.password_history) ? row.password_history : [],
    role: row.role,
    status: row.status,
    must_change_password: Boolean(
      row.must_change_password
    ),
    failed_login_attempts: Number(
      row.failed_login_attempts || 0
    ),
    locked_until: row.locked_until ? new Date(
      row.locked_until
    ).toISOString() : null,
    session_version: Number(
      row.session_version || 1
    ),
    last_login_at: row.last_login_at ? new Date(
      row.last_login_at
    ).toISOString() : null,
    password_changed_at: new Date(
      row.password_changed_at
    ).toISOString(),
    created_at: new Date(
      row.created_at
    ).toISOString(),
    updated_at: new Date(
      row.updated_at
    ).toISOString(),
    created_by: row.created_by ? String(row.created_by) : null,
    updated_by: row.updated_by ? String(row.updated_by) : null
  };
}
function mapPostgresAudit(row) {
  return {
    id: String(row.id),
    timestamp: new Date(
      row.timestamp
    ).toISOString(),
    actor_user_id: row.actor_user_id ? String(row.actor_user_id) : null,
    actor_email: String(
      row.actor_email
    ),
    action: String(row.action),
    target_user_id: row.target_user_id ? String(row.target_user_id) : null,
    target_email: row.target_email ? String(row.target_email) : null,
    ip_address: row.ip_address ? String(row.ip_address) : null,
    user_agent: row.user_agent ? String(row.user_agent) : null,
    result: row.result,
    details: String(
      row.details || ""
    )
  };
}
async function initializeAuthStore() {
  if (USE_LOCAL_AUTH_STORE) {
    try {
      await import_promises.default.access(
        AUTH_DATA_PATH
      );
    } catch {
      await writeLocalData(
        EMPTY_AUTH_DATA
      );
    }
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      role TEXT NOT NULL CHECK (
        role IN (
          'super_admin',
          'admin',
          'manager',
          'staff',
          'viewer'
        )
      ),
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (
          status IN (
            'active',
            'inactive'
          )
        ),
      must_change_password BOOLEAN
        NOT NULL DEFAULT TRUE,
      failed_login_attempts INTEGER
        NOT NULL DEFAULT 0,
      locked_until TIMESTAMPTZ NULL,
      session_version INTEGER
        NOT NULL DEFAULT 1,
      last_login_at TIMESTAMPTZ NULL,
      password_changed_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
      created_by TEXT NULL,
      updated_by TEXT NULL
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    app_users_status_idx
    ON app_users(status)
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS
    auth_audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
      actor_user_id TEXT NULL,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_user_id TEXT NULL,
      target_email TEXT NULL,
      ip_address TEXT NULL,
      user_agent TEXT NULL,
      result TEXT NOT NULL
        CHECK (
          result IN (
            'success',
            'failure'
          )
        ),
      details TEXT NOT NULL DEFAULT ''
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    auth_audit_timestamp_idx
    ON auth_audit_logs(
      timestamp DESC
    )
  `);
}
async function countUsers() {
  if (USE_LOCAL_AUTH_STORE) {
    return (await readLocalData()).users.length;
  }
  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM app_users
    `
  );
  return Number(
    result.rows[0]?.count || 0
  );
}
async function listUsers() {
  if (USE_LOCAL_AUTH_STORE) {
    return (await readLocalData()).users.slice().sort(
      (a, b) => a.name.localeCompare(b.name)
    );
  }
  const result = await pool.query(`
    SELECT *
    FROM app_users
    ORDER BY
      name ASC,
      email ASC
  `);
  return result.rows.map(
    mapPostgresUser
  );
}
async function findUserById(id) {
  if (USE_LOCAL_AUTH_STORE) {
    return (await readLocalData()).users.find(
      (user) => user.id === id
    ) || null;
  }
  const result = await pool.query(
    `
      SELECT *
      FROM app_users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return result.rows[0] ? mapPostgresUser(
    result.rows[0]
  ) : null;
}
async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (USE_LOCAL_AUTH_STORE) {
    return (await readLocalData()).users.find(
      (user) => normalizeEmail(
        user.email
      ) === normalized
    ) || null;
  }
  const result = await pool.query(
    `
      SELECT *
      FROM app_users
      WHERE LOWER(email) =
        LOWER($1)
      LIMIT 1
    `,
    [normalized]
  );
  return result.rows[0] ? mapPostgresUser(
    result.rows[0]
  ) : null;
}
async function createUserRecord(input) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const record = {
    ...input,
    id: input.id || (0, import_crypto.randomUUID)(),
    email: normalizeEmail(
      input.email
    ),
    created_at: now,
    updated_at: now
  };
  if (USE_LOCAL_AUTH_STORE) {
    return withLocalWrite(
      (data) => {
        const emailAlreadyExists = data.users.some(
          (user) => normalizeEmail(
            user.email
          ) === record.email
        );
        if (emailAlreadyExists) {
          throw new Error(
            "A user with this email already exists."
          );
        }
        data.users.push(record);
        return record;
      }
    );
  }
  const result = await pool.query(
    `
      INSERT INTO app_users (
        id,
        name,
        email,
        password_hash,
        password_history,
        role,
        status,
        must_change_password,
        failed_login_attempts,
        locked_until,
        session_version,
        last_login_at,
        password_changed_at,
        created_at,
        updated_at,
        created_by,
        updated_by
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17
      )
      RETURNING *
    `,
    [
      record.id,
      record.name,
      record.email,
      record.password_hash,
      JSON.stringify(
        record.password_history
      ),
      record.role,
      record.status,
      record.must_change_password,
      record.failed_login_attempts,
      record.locked_until,
      record.session_version,
      record.last_login_at,
      record.password_changed_at,
      record.created_at,
      record.updated_at,
      record.created_by,
      record.updated_by
    ]
  );
  return mapPostgresUser(
    result.rows[0]
  );
}
async function updateUserRecord(id, updates) {
  const safeUpdates = {
    ...updates,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  delete safeUpdates.id;
  delete safeUpdates.created_at;
  if (safeUpdates.email) {
    safeUpdates.email = normalizeEmail(
      safeUpdates.email
    );
  }
  if (USE_LOCAL_AUTH_STORE) {
    return withLocalWrite(
      (data) => {
        const index = data.users.findIndex(
          (user) => user.id === id
        );
        if (index === -1) {
          throw new Error(
            "User not found."
          );
        }
        if (safeUpdates.email && data.users.some(
          (user) => user.id !== id && normalizeEmail(
            user.email
          ) === safeUpdates.email
        )) {
          throw new Error(
            "A user with this email already exists."
          );
        }
        data.users[index] = {
          ...data.users[index],
          ...safeUpdates
        };
        return data.users[index];
      }
    );
  }
  const entries = Object.entries(
    safeUpdates
  ).filter(
    ([, value]) => value !== void 0
  );
  if (entries.length === 0) {
    const existing = await findUserById(id);
    if (!existing) {
      throw new Error(
        "User not found."
      );
    }
    return existing;
  }
  const values = [];
  const assignments = entries.map(
    ([key, value], index) => {
      values.push(
        key === "password_history" ? JSON.stringify(value) : value
      );
      return `${key} = $${index + 1}` + (key === "password_history" ? "::jsonb" : "");
    }
  );
  values.push(id);
  const result = await pool.query(
    `
      UPDATE app_users
      SET ${assignments.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `,
    values
  );
  if (!result.rows[0]) {
    throw new Error(
      "User not found."
    );
  }
  return mapPostgresUser(
    result.rows[0]
  );
}
async function countActiveSuperAdmins(excludeUserId) {
  if (USE_LOCAL_AUTH_STORE) {
    return (await readLocalData()).users.filter(
      (user) => user.id !== excludeUserId && user.role === "super_admin" && user.status === "active"
    ).length;
  }
  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM app_users
      WHERE
        role = 'super_admin'
        AND status = 'active'
        AND (
          $1::text IS NULL
          OR id <> $1
        )
    `,
    [
      excludeUserId || null
    ]
  );
  return Number(
    result.rows[0]?.count || 0
  );
}
async function addAuthAuditLog(log) {
  const record = {
    ...log,
    id: log.id || (0, import_crypto.randomUUID)(),
    timestamp: log.timestamp || (/* @__PURE__ */ new Date()).toISOString()
  };
  if (USE_LOCAL_AUTH_STORE) {
    return withLocalWrite(
      (data) => {
        data.audit_logs.unshift(
          record
        );
        data.audit_logs = data.audit_logs.slice(
          0,
          MAX_AUDIT_LOGS
        );
        return record;
      }
    );
  }
  const result = await pool.query(
    `
      INSERT INTO auth_audit_logs (
        id,
        timestamp,
        actor_user_id,
        actor_email,
        action,
        target_user_id,
        target_email,
        ip_address,
        user_agent,
        result,
        details
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11
      )
      RETURNING *
    `,
    [
      record.id,
      record.timestamp,
      record.actor_user_id,
      record.actor_email,
      record.action,
      record.target_user_id,
      record.target_email,
      record.ip_address,
      record.user_agent,
      record.result,
      record.details
    ]
  );
  return mapPostgresAudit(
    result.rows[0]
  );
}
async function listAuthAuditLogs(limit = 200) {
  const safeLimit = Math.max(
    1,
    Math.min(
      1e3,
      Number(limit) || 200
    )
  );
  if (USE_LOCAL_AUTH_STORE) {
    return (await readLocalData()).audit_logs.slice(
      0,
      safeLimit
    );
  }
  const result = await pool.query(
    `
      SELECT *
      FROM auth_audit_logs
      ORDER BY timestamp DESC
      LIMIT $1
    `,
    [safeLimit]
  );
  return result.rows.map(
    mapPostgresAudit
  );
}

// server/auth/password.ts
var import_crypto2 = require("crypto");
var KEY_LENGTH = 64;
var SCRYPT_COST = 16384;
var SCRYPT_BLOCK_SIZE = 8;
var SCRYPT_PARALLELIZATION = 1;
var SIMPLE_PASSWORD_MIN_LENGTH = 6;
var SIMPLE_PASSWORD_MAX_LENGTH = 128;
function deriveKey(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    (0, import_crypto2.scrypt)(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}
function validatePassword(password, _context = {}) {
  const errors = [];
  const normalized = String(password || "");
  if (normalized.length < SIMPLE_PASSWORD_MIN_LENGTH) {
    errors.push(
      `Password must contain at least ${SIMPLE_PASSWORD_MIN_LENGTH} characters.`
    );
  }
  if (normalized.length > SIMPLE_PASSWORD_MAX_LENGTH) {
    errors.push(
      `Password must not exceed ${SIMPLE_PASSWORD_MAX_LENGTH} characters.`
    );
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
async function hashPassword(password) {
  const salt = (0, import_crypto2.randomBytes)(16);
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: 64 * 1024 * 1024
  });
  return [
    "scrypt",
    String(SCRYPT_COST),
    String(SCRYPT_BLOCK_SIZE),
    String(SCRYPT_PARALLELIZATION),
    salt.toString("base64"),
    derivedKey.toString("base64")
  ].join("$");
}
async function verifyPassword(password, encodedHash) {
  try {
    const [algorithm, cost, blockSize, parallelization, saltBase64, hashBase64] = encodedHash.split("$");
    if (algorithm !== "scrypt" || !saltBase64 || !hashBase64) {
      return false;
    }
    const expectedHash = Buffer.from(hashBase64, "base64");
    const actualHash = await deriveKey(
      password,
      Buffer.from(saltBase64, "base64"),
      expectedHash.length,
      {
        N: Number(cost),
        r: Number(blockSize),
        p: Number(parallelization),
        maxmem: 64 * 1024 * 1024
      }
    );
    return expectedHash.length === actualHash.length && (0, import_crypto2.timingSafeEqual)(expectedHash, actualHash);
  } catch {
    return false;
  }
}
function generateTemporaryPassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const targetLength = Math.max(8, length);
  return Array.from({ length: targetLength }, () => {
    return alphabet[(0, import_crypto2.randomBytes)(1)[0] % alphabet.length];
  }).join("");
}

// server/auth/permissions.ts
var PERMISSIONS = {
  DATA_READ: "data.read",
  INVENTORY_MANAGE: "inventory.manage",
  INVENTORY_DELETE: "inventory.delete",
  STOCK_MANAGE: "stock.manage",
  SALES_MANAGE: "sales.manage",
  RETURNS_MANAGE: "returns.manage",
  TRANSFERS_MANAGE: "transfers.manage",
  DAMAGE_MANAGE: "damage.manage",
  SETTINGS_MANAGE: "settings.manage",
  USERS_MANAGE: "users.manage",
  AUTH_AUDIT_READ: "auth.audit.read"
};
var ALL_PERMISSIONS = Object.values(PERMISSIONS);
var ROLE_PERMISSIONS = {
  super_admin: ALL_PERMISSIONS,
  admin: [
    PERMISSIONS.DATA_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_DELETE,
    PERMISSIONS.STOCK_MANAGE,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.RETURNS_MANAGE,
    PERMISSIONS.TRANSFERS_MANAGE,
    PERMISSIONS.DAMAGE_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUTH_AUDIT_READ
  ],
  manager: [
    PERMISSIONS.DATA_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.STOCK_MANAGE,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.RETURNS_MANAGE,
    PERMISSIONS.TRANSFERS_MANAGE,
    PERMISSIONS.DAMAGE_MANAGE
  ],
  staff: [
    PERMISSIONS.DATA_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.STOCK_MANAGE,
    PERMISSIONS.SALES_MANAGE,
    PERMISSIONS.RETURNS_MANAGE
  ],
  viewer: [
    PERMISSIONS.DATA_READ
  ]
};
function getPermissionsForRole(role) {
  return [...ROLE_PERMISSIONS[role]];
}
function roleHasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// server/auth/token.ts
var import_crypto3 = require("crypto");
var ACCESS_TOKEN_DURATION_MS = 8 * 60 * 60 * 1e3;
var REMEMBERED_TOKEN_DURATION_MS = 30 * 24 * 60 * 60 * 1e3;
function getTokenSecret() {
  const configured = String(
    process.env.SESSION_SECRET || ""
  ).trim();
  if (configured.length >= 32) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must contain at least 32 characters in production."
    );
  }
  console.warn(
    "SESSION_SECRET is missing or too short. Using a development-only token secret."
  );
  return "development-only-change-this-auth-token-secret-now";
}
function encodeJson(value) {
  return Buffer.from(
    JSON.stringify(value),
    "utf8"
  ).toString("base64url");
}
function sign(value) {
  return (0, import_crypto3.createHmac)(
    "sha256",
    getTokenSecret()
  ).update(value).digest("base64url");
}
function signaturesMatch(expected, received) {
  try {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length && (0, import_crypto3.timingSafeEqual)(
      expectedBuffer,
      receivedBuffer
    );
  } catch {
    return false;
  }
}
function issueAuthToken(user, durationMs = ACCESS_TOKEN_DURATION_MS) {
  const now = Date.now();
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionVersion: user.session_version,
    issuedAt: now,
    expiresAt: now + durationMs
  };
  const header = encodeJson({
    alg: "HS256",
    typ: "JWT"
  });
  const body = encodeJson(payload);
  const unsigned = `${header}.${body}`;
  const signature = sign(unsigned);
  return {
    accessToken: `${unsigned}.${signature}`,
    expiresAt: new Date(
      payload.expiresAt
    ).toISOString()
  };
}
function verifyAuthToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    const [header, body, signature] = parts;
    const unsigned = `${header}.${body}`;
    const expectedSignature = sign(unsigned);
    if (!signaturesMatch(
      expectedSignature,
      signature
    )) {
      return null;
    }
    const parsedHeader = JSON.parse(
      Buffer.from(
        header,
        "base64url"
      ).toString("utf8")
    );
    if (parsedHeader?.alg !== "HS256" || parsedHeader?.typ !== "JWT") {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(
        body,
        "base64url"
      ).toString("utf8")
    );
    if (!payload.userId || !payload.email || !Number.isFinite(
      payload.sessionVersion
    ) || !Number.isFinite(
      payload.expiresAt
    ) || payload.expiresAt <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// server/auth/middleware.ts
function toAuthUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.must_change_password,
    permissions: getPermissionsForRole(user.role),
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at
  };
}
function getBearerToken(req) {
  const authorization = String(
    req.get("authorization") || ""
  ).trim();
  const match = authorization.match(
    /^Bearer\s+(.+)$/i
  );
  return match?.[1]?.trim() || null;
}
async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({
        error: "Authentication required."
      });
    }
    const payload = verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({
        error: "Your sign-in token is invalid or expired. Please sign in again."
      });
    }
    const user = await findUserById(
      payload.userId
    );
    if (!user || user.status !== "active") {
      return res.status(401).json({
        error: "Your account is no longer active."
      });
    }
    if (user.session_version !== payload.sessionVersion) {
      return res.status(401).json({
        error: "Your sign-in token has expired. Please sign in again."
      });
    }
    req.authUser = toAuthUser(user);
    req.authToken = payload;
    next();
  } catch (error) {
    next(error);
  }
}
function requirePermission(permission) {
  return (req, res, next) => {
    if (req.authUser?.mustChangePassword) {
      return res.status(403).json({
        error: "You must change your temporary password before continuing.",
        code: "PASSWORD_CHANGE_REQUIRED"
      });
    }
    const role = req.authUser?.role;
    if (!role || !roleHasPermission(
      role,
      permission
    )) {
      return res.status(403).json({
        error: "You do not have permission to perform this action."
      });
    }
    next();
  };
}

// server/auth/types.ts
var USER_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "staff",
  "viewer"
];

// server/auth/routes.ts
var authRouter = (0, import_express.Router)();
var usersRouter = (0, import_express.Router)();
var MAX_FAILED_LOGIN_ATTEMPTS = 5;
var ACCOUNT_LOCK_MS = 15 * 60 * 1e3;
var ALLOWED_EMAIL_DOMAIN = "mjkhan.com";
var ALLOWED_EMAIL_SUFFIX = `@${ALLOWED_EMAIL_DOMAIN}`;
var ALLOWED_EMAIL_ERROR = `Only ${ALLOWED_EMAIL_SUFFIX} email addresses are allowed.`;
function isAllowedEmail(email) {
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_SUFFIX);
}
var allowedEmailSchema = import_zod.z.string().trim().email().max(254).refine(isAllowedEmail, {
  message: ALLOWED_EMAIL_ERROR
});
var loginLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." }
});
var loginSchema = import_zod.z.object({
  email: allowedEmailSchema,
  password: import_zod.z.string().min(1).max(128),
  rememberMe: import_zod.z.boolean().optional().default(false)
});
var changePasswordSchema = import_zod.z.object({
  currentPassword: import_zod.z.string().min(1).max(128),
  newPassword: import_zod.z.string().min(1).max(128),
  confirmPassword: import_zod.z.string().min(1).max(128)
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "New password and confirmation do not match.",
  path: ["confirmPassword"]
});
var createUserSchema = import_zod.z.object({
  name: import_zod.z.string().trim().min(2).max(100),
  email: allowedEmailSchema,
  role: import_zod.z.enum(USER_ROLES),
  password: import_zod.z.string().max(128).optional(),
  generatePassword: import_zod.z.boolean().optional().default(true),
  mustChangePassword: import_zod.z.boolean().optional().default(true)
});
var updateUserSchema = import_zod.z.object({
  name: import_zod.z.string().trim().min(2).max(100),
  email: allowedEmailSchema,
  role: import_zod.z.enum(USER_ROLES),
  status: import_zod.z.enum(["active", "inactive"]),
  mustChangePassword: import_zod.z.boolean().optional()
});
var resetPasswordSchema = import_zod.z.object({
  password: import_zod.z.string().max(128).optional(),
  generatePassword: import_zod.z.boolean().optional().default(true),
  mustChangePassword: import_zod.z.boolean().optional().default(true)
});
function getClientIp(req) {
  return req.ip || req.socket.remoteAddress || null;
}
async function audit(req, input) {
  await addAuthAuditLog({
    actor_user_id: input.actorUserId ?? req.authUser?.id ?? null,
    actor_email: input.actorEmail ?? req.authUser?.email ?? "anonymous",
    action: input.action,
    target_user_id: input.targetUserId ?? null,
    target_email: input.targetEmail ?? null,
    ip_address: getClientIp(req),
    user_agent: req.get("user-agent") || null,
    result: input.result,
    details: input.details
  });
}
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.must_change_password,
    isLocked: Boolean(user.locked_until && new Date(user.locked_until).getTime() > Date.now()),
    lockedUntil: user.locked_until,
    lastLoginAt: user.last_login_at,
    passwordChangedAt: user.password_changed_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    createdBy: user.created_by,
    updatedBy: user.updated_by
  };
}
async function passwordWasUsedBefore(user, password) {
  const hashes = [user.password_hash, ...user.password_history].filter(Boolean);
  for (const hash of hashes) {
    if (await verifyPassword(password, hash)) return true;
  }
  return false;
}
authRouter.get("/bootstrap-status", async (_req, res, next) => {
  try {
    const totalUsers = await countUsers();
    res.json({ initialized: totalUsers > 0 });
  } catch (error) {
    next(error);
  }
});
authRouter.post("/login", loginLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || "Enter a valid email and password."
    });
  }
  const { email, password, rememberMe } = parsed.data;
  try {
    const user = await findUserByEmail(email);
    const genericError = "Invalid email or password.";
    if (!user) {
      await audit(req, {
        action: "login",
        result: "failure",
        details: "Sign-in failed: account not found or password invalid.",
        targetEmail: email.toLowerCase(),
        actorEmail: email.toLowerCase()
      });
      return res.status(401).json({ error: genericError });
    }
    if (user.status !== "active") {
      await audit(req, {
        action: "login",
        result: "failure",
        details: "Sign-in rejected because the account is inactive.",
        targetUserId: user.id,
        targetEmail: user.email,
        actorUserId: user.id,
        actorEmail: user.email
      });
      return res.status(401).json({ error: genericError });
    }
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      await audit(req, {
        action: "login",
        result: "failure",
        details: "Sign-in rejected because the account is temporarily locked.",
        targetUserId: user.id,
        targetEmail: user.email,
        actorUserId: user.id,
        actorEmail: user.email
      });
      return res.status(423).json({
        error: "Account temporarily locked after repeated failed attempts. Try again later."
      });
    }
    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      const failedAttempts = user.failed_login_attempts + 1;
      const shouldLock = failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
      await updateUserRecord(user.id, {
        failed_login_attempts: shouldLock ? 0 : failedAttempts,
        locked_until: shouldLock ? new Date(Date.now() + ACCOUNT_LOCK_MS).toISOString() : null,
        updated_by: user.email
      });
      await audit(req, {
        action: "login",
        result: "failure",
        details: shouldLock ? "Sign-in failed and account was temporarily locked." : `Sign-in failed. Attempt ${failedAttempts} of ${MAX_FAILED_LOGIN_ATTEMPTS}.`,
        targetUserId: user.id,
        targetEmail: user.email,
        actorUserId: user.id,
        actorEmail: user.email
      });
      return res.status(401).json({ error: genericError });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const signedInUser = await updateUserRecord(user.id, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: now,
      updated_by: user.email
    });
    const token = issueAuthToken(
      signedInUser,
      rememberMe ? REMEMBERED_TOKEN_DURATION_MS : ACCESS_TOKEN_DURATION_MS
    );
    await audit(req, {
      action: "login",
      result: "success",
      details: rememberMe ? "User signed in with remembered session." : "User signed in.",
      targetUserId: signedInUser.id,
      targetEmail: signedInUser.email,
      actorUserId: signedInUser.id,
      actorEmail: signedInUser.email
    });
    res.json({
      user: toAuthUser(signedInUser),
      ...token
    });
  } catch (error) {
    next(error);
  }
});
authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.authUser });
});
authRouter.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const currentUser = req.authUser;
    await audit(req, {
      action: "logout",
      result: "success",
      details: "User signed out.",
      targetUserId: currentUser?.id,
      targetEmail: currentUser?.email
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
authRouter.post(
  "/change-password",
  requireAuth,
  async (req, res, next) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid password information."
      });
    }
    try {
      const user = await findUserById(req.authUser.id);
      if (!user) return res.status(404).json({ error: "User not found." });
      if (!await verifyPassword(parsed.data.currentPassword, user.password_hash)) {
        await audit(req, {
          action: "change_password",
          result: "failure",
          details: "Password change failed because the current password was invalid.",
          targetUserId: user.id,
          targetEmail: user.email
        });
        return res.status(400).json({ error: "Current password is incorrect." });
      }
      const validation = validatePassword(parsed.data.newPassword, {
        name: user.name,
        email: user.email
      });
      if (!validation.valid) {
        return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
      }
      if (await passwordWasUsedBefore(user, parsed.data.newPassword)) {
        return res.status(400).json({
          error: "Choose a password that has not been used recently."
        });
      }
      const newHash = await hashPassword(parsed.data.newPassword);
      const updated = await updateUserRecord(user.id, {
        password_hash: newHash,
        password_history: [user.password_hash, ...user.password_history].slice(0, 5),
        must_change_password: false,
        password_changed_at: (/* @__PURE__ */ new Date()).toISOString(),
        session_version: user.session_version + 1,
        updated_by: user.email
      });
      const token = issueAuthToken(
        updated,
        ACCESS_TOKEN_DURATION_MS
      );
      await audit(req, {
        action: "change_password",
        result: "success",
        details: "User changed their password.",
        targetUserId: updated.id,
        targetEmail: updated.email
      });
      res.json({
        user: toAuthUser(updated),
        ...token
      });
    } catch (error) {
      next(error);
    }
  }
);
usersRouter.use(
  requireAuth,
  requirePermission(PERMISSIONS.USERS_MANAGE)
);
usersRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ users: (await listUsers()).map(publicUser) });
  } catch (error) {
    next(error);
  }
});
usersRouter.get("/audit-logs", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 200);
    res.json({ logs: await listAuthAuditLogs(limit) });
  } catch (error) {
    next(error);
  }
});
usersRouter.post("/", async (req, res, next) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid user details." });
  }
  try {
    const actor = req.authUser;
    const generatedPassword = parsed.data.generatePassword ? generateTemporaryPassword() : String(parsed.data.password || "");
    const validation = validatePassword(generatedPassword, {
      name: parsed.data.name,
      email: parsed.data.email
    });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }
    if (await findUserByEmail(parsed.data.email)) {
      return res.status(409).json({ error: "A user with this email already exists." });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const user = await createUserRecord({
      name: parsed.data.name,
      email: parsed.data.email,
      password_hash: await hashPassword(generatedPassword),
      password_history: [],
      role: parsed.data.role,
      status: "active",
      must_change_password: parsed.data.mustChangePassword,
      failed_login_attempts: 0,
      locked_until: null,
      session_version: 1,
      last_login_at: null,
      password_changed_at: now,
      created_by: actor.email,
      updated_by: actor.email
    });
    await audit(req, {
      action: "create_user",
      result: "success",
      details: `Created ${user.role} account.`,
      targetUserId: user.id,
      targetEmail: user.email
    });
    res.status(201).json({
      user: publicUser(user),
      temporaryPassword: generatedPassword
    });
  } catch (error) {
    next(error);
  }
});
usersRouter.put("/:id", async (req, res, next) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid user details." });
  }
  try {
    const actor = req.authUser;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    const isRemovingActiveSuperAdmin = target.role === "super_admin" && target.status === "active" && (parsed.data.role !== "super_admin" || parsed.data.status !== "active");
    if (isRemovingActiveSuperAdmin && await countActiveSuperAdmins(target.id) === 0) {
      return res.status(400).json({ error: "At least one active super admin must remain." });
    }
    if (target.id === actor.id && parsed.data.status !== "active") {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }
    if (target.id === actor.id && parsed.data.role !== target.role) {
      return res.status(400).json({ error: "You cannot change your own role." });
    }
    const sensitiveChange = target.role !== parsed.data.role || target.status !== parsed.data.status || target.email.toLowerCase() !== parsed.data.email.toLowerCase() || parsed.data.mustChangePassword !== void 0 && parsed.data.mustChangePassword !== target.must_change_password;
    const updated = await updateUserRecord(target.id, {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      status: parsed.data.status,
      must_change_password: parsed.data.mustChangePassword ?? target.must_change_password,
      session_version: sensitiveChange ? target.session_version + 1 : target.session_version,
      updated_by: actor.email
    });
    await audit(req, {
      action: "update_user",
      result: "success",
      details: `Updated account. Role: ${updated.role}; status: ${updated.status}.`,
      targetUserId: updated.id,
      targetEmail: updated.email
    });
    res.json({ user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});
usersRouter.patch("/:id/status", async (req, res, next) => {
  const status = req.body?.status;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Status must be active or inactive." });
  }
  try {
    const actor = req.authUser;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    if (target.id === actor.id && status === "inactive") {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }
    if (target.role === "super_admin" && target.status === "active" && status === "inactive" && await countActiveSuperAdmins(target.id) === 0) {
      return res.status(400).json({ error: "At least one active super admin must remain." });
    }
    const updated = await updateUserRecord(target.id, {
      status,
      session_version: target.session_version + 1,
      updated_by: actor.email
    });
    await audit(req, {
      action: status === "active" ? "activate_user" : "deactivate_user",
      result: "success",
      details: `Account status changed to ${status}.`,
      targetUserId: updated.id,
      targetEmail: updated.email
    });
    res.json({ user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});
usersRouter.post("/:id/reset-password", async (req, res, next) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid password reset request." });
  }
  try {
    const actor = req.authUser;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    if (target.id === actor.id) {
      return res.status(400).json({ error: "Use Change Password for your own account." });
    }
    const temporaryPassword = parsed.data.generatePassword ? generateTemporaryPassword() : String(parsed.data.password || "");
    const validation = validatePassword(temporaryPassword, {
      name: target.name,
      email: target.email
    });
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }
    if (await passwordWasUsedBefore(target, temporaryPassword)) {
      return res.status(400).json({ error: "Choose a password not used recently by this user." });
    }
    const updated = await updateUserRecord(target.id, {
      password_hash: await hashPassword(temporaryPassword),
      password_history: [target.password_hash, ...target.password_history].slice(0, 5),
      must_change_password: parsed.data.mustChangePassword,
      password_changed_at: (/* @__PURE__ */ new Date()).toISOString(),
      failed_login_attempts: 0,
      locked_until: null,
      session_version: target.session_version + 1,
      updated_by: actor.email
    });
    await audit(req, {
      action: "reset_password",
      result: "success",
      details: "Administrator reset the user's password and invalidated existing sessions.",
      targetUserId: updated.id,
      targetEmail: updated.email
    });
    res.json({ user: publicUser(updated), temporaryPassword });
  } catch (error) {
    next(error);
  }
});
usersRouter.post("/:id/unlock", async (req, res, next) => {
  try {
    const actor = req.authUser;
    const target = await findUserById(req.params.id);
    if (!target) return res.status(404).json({ error: "User not found." });
    const updated = await updateUserRecord(target.id, {
      failed_login_attempts: 0,
      locked_until: null,
      updated_by: actor.email
    });
    await audit(req, {
      action: "unlock_user",
      result: "success",
      details: "Administrator unlocked the account.",
      targetUserId: updated.id,
      targetEmail: updated.email
    });
    res.json({ user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});

// server/auth/authorization.ts
function requiredPermissionForRequest(req) {
  const method = req.method.toUpperCase();
  const path3 = req.path;
  if (method === "GET") {
    return PERMISSIONS.DATA_READ;
  }
  if (path3 === "/settings") {
    return PERMISSIONS.SETTINGS_MANAGE;
  }
  if (path3 === "/add-stock") {
    return PERMISSIONS.STOCK_MANAGE;
  }
  if (path3 === "/sales") {
    return PERMISSIONS.SALES_MANAGE;
  }
  if (path3 === "/customer-returns" || path3 === "/publisher-returns") {
    return PERMISSIONS.RETURNS_MANAGE;
  }
  if (path3 === "/stock-transfers") {
    return PERMISSIONS.TRANSFERS_MANAGE;
  }
  if (path3 === "/damage-loss") {
    return PERMISSIONS.DAMAGE_MANAGE;
  }
  if (path3 === "/smart-entry") {
    return PERMISSIONS.INVENTORY_MANAGE;
  }
  if (path3.startsWith("/books") || path3.startsWith("/publishers") || path3.startsWith("/locations") || path3.startsWith("/categories") || path3.startsWith("/subjects") || path3.startsWith("/classes")) {
    return method === "DELETE" ? PERMISSIONS.INVENTORY_DELETE : PERMISSIONS.INVENTORY_MANAGE;
  }
  return PERMISSIONS.DATA_READ;
}
function authorizeBusinessApi(req, res, next) {
  if (req.authUser?.mustChangePassword) {
    res.status(403).json({
      error: "You must change your temporary password before continuing.",
      code: "PASSWORD_CHANGE_REQUIRED"
    });
    return;
  }
  const role = req.authUser?.role;
  const requiredPermission = requiredPermissionForRequest(req);
  if (!role || requiredPermission && !roleHasPermission(
    role,
    requiredPermission
  )) {
    res.status(403).json({
      error: "You do not have permission to perform this action."
    });
    return;
  }
  next();
}

// server/auth/requestContext.ts
var import_async_hooks = require("async_hooks");
var requestContext = new import_async_hooks.AsyncLocalStorage();
function requestContextMiddleware(req, _res, next) {
  requestContext.run(
    {
      actorEmail: req.authUser?.email || "system"
    },
    next
  );
}
function getCurrentActorEmail() {
  return requestContext.getStore()?.actorEmail || "system";
}

// server.ts
var app = (0, import_express2.default)();
var PORT = Number(process.env.PORT) || 3e3;
var DB_PATH = import_path2.default.join(process.cwd(), "db.json");
var SETTINGS_PATH = import_path2.default.join(process.cwd(), "settings.json");
var authInitializationPromise = null;
function ensureAuthStoreInitialized() {
  if (!authInitializationPromise) {
    authInitializationPromise = initializeAuthStore();
  }
  return authInitializationPromise;
}
var DATABASE_MODE3 = (process.env.DATABASE_MODE || "local").toLowerCase();
var USE_LOCAL_DATABASE = DATABASE_MODE3 === "local";
if (process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(
  (0, import_helmet.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(import_express2.default.json({ limit: "10mb" }));
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const durationMs = Date.now() - startTime;
    const contentLength = res.getHeader("content-length");
    console.log(
      `[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms${contentLength ? ` - ${contentLength} bytes` : ""}`
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
var EMPTY_DB = {
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
var DEFAULT_SETTINGS = {
  businessName: "Junaid Books Management System",
  currency: "PKR",
  taxRate: 0,
  globalReorderLevel: 20
};
var writeQueue = Promise.resolve();
var businessInitializationPromise = null;
var dbSnapshots = /* @__PURE__ */ new WeakMap();
var ApiError = class extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
};
function sendError(res, error) {
  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  const databaseCode = String(error?.code || "");
  if (databaseCode === "23505") {
    res.status(409).json({
      error: "A record with the same unique value already exists. Refresh and try again."
    });
    return;
  }
  if (databaseCode === "23503") {
    res.status(409).json({
      error: "This record is linked to other data and cannot be changed or deleted."
    });
    return;
  }
  if (databaseCode === "23514" || databaseCode === "22P02" || databaseCode === "22003") {
    res.status(400).json({ error: "One or more entered values are invalid." });
    return;
  }
  console.error(error);
  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "The request could not be completed. Please try again." : error?.message || "The request could not be completed."
  });
}
function normalizeDb(data = {}) {
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
function cloneDb(data) {
  return normalizeDb(JSON.parse(JSON.stringify(data)));
}
function canonicalRow(row) {
  if (!row) return "";
  const normalized = Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== void 0).sort(([left], [right]) => left.localeCompare(right))
  );
  return JSON.stringify(normalized);
}
function valuesWithoutId(row) {
  return Object.fromEntries(
    Object.entries(row).filter(([key]) => key !== "id").map(([key, value]) => [key, value === void 0 ? null : value])
  );
}
async function readJsonDb() {
  try {
    const raw = await import_promises2.default.readFile(DB_PATH, "utf8");
    const database = normalizeDb(JSON.parse(raw));
    assertDatabaseIntegrity(database);
    return database;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return normalizeDb(EMPTY_DB);
    }
    throw error;
  }
}
async function writeJsonDb(data) {
  const tmpPath = `${DB_PATH}.tmp`;
  await import_promises2.default.writeFile(tmpPath, JSON.stringify(normalizeDb(data), null, 2));
  await import_promises2.default.rename(tmpPath, DB_PATH);
}
async function ensureBusinessStoreInitialized() {
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
        `CREATE UNIQUE INDEX IF NOT EXISTS stock_balances_book_location_unique ON stock_balances (book_id, location_id)`
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
async function ensureApplicationStoresInitialized() {
  await Promise.all([
    ensureAuthStoreInitialized(),
    ensureBusinessStoreInitialized()
  ]);
}
function sanitizeSettings(settings) {
  const taxRate = Number(settings.taxRate);
  const globalReorderLevel = Number(settings.globalReorderLevel);
  return {
    businessName: String(settings.businessName || DEFAULT_SETTINGS.businessName).trim(),
    currency: String(settings.currency || DEFAULT_SETTINGS.currency).trim().toUpperCase(),
    taxRate: Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : DEFAULT_SETTINGS.taxRate,
    globalReorderLevel: Number.isFinite(globalReorderLevel) && globalReorderLevel >= 0 ? Math.floor(globalReorderLevel) : DEFAULT_SETTINGS.globalReorderLevel
  };
}
async function readSettings() {
  if (USE_LOCAL_DATABASE) {
    try {
      const raw = await import_promises2.default.readFile(SETTINGS_PATH, "utf8");
      return sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch (error) {
      if (error?.code === "ENOENT") {
        return { ...DEFAULT_SETTINGS };
      }
      throw error;
    }
  }
  await ensureBusinessStoreInitialized();
  const result = await pool.query(
    `SELECT value FROM app_settings WHERE id = $1 LIMIT 1`,
    ["business"]
  );
  return sanitizeSettings({ ...DEFAULT_SETTINGS, ...result.rows[0]?.value || {} });
}
async function writeSettings(settings) {
  const safeSettings = sanitizeSettings(settings);
  if (USE_LOCAL_DATABASE) {
    const tmpPath = `${SETTINGS_PATH}.tmp`;
    await import_promises2.default.writeFile(tmpPath, JSON.stringify(safeSettings, null, 2));
    await import_promises2.default.rename(tmpPath, SETTINGS_PATH);
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
    ["business", JSON.stringify(safeSettings)]
  );
  return safeSettings;
}
function makeId(prefix) {
  return `${prefix}-${(0, import_crypto4.randomUUID)()}`;
}
function nextCode(items, field, prefix, pad = 3, start = 1) {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const maxNumber = items.reduce((max, item) => {
    const value = String(item[field] || "");
    const match = value.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, start - 1);
  return `${prefix}-${String(maxNumber + 1).padStart(pad, "0")}`;
}
function nextPlainCode(items, field, prefix, start = 1001) {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const maxNumber = items.reduce((max, item) => {
    const value = String(item[field] || "");
    const match = value.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, start - 1);
  return `${prefix}-${maxNumber + 1}`;
}
function ensureExists(items, predicate, message) {
  const found = items.find(predicate);
  if (!found) throw new ApiError(404, message);
  return found;
}
function hasDuplicateName(items, name, excludedId) {
  const normalized = name.trim().toLocaleLowerCase();
  return items.some((item) => {
    const itemName = String(item.name ?? item.publisher_name ?? "").trim().toLocaleLowerCase();
    return item.id !== excludedId && itemName === normalized;
  });
}
function requirePositiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new ApiError(400, `${label} must be a whole number greater than 0.`);
  }
  return number;
}
function requireNonNegativeNumber(value, label, fallback) {
  if ((value === void 0 || value === null || value === "") && fallback !== void 0) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ApiError(400, `${label} must be 0 or greater.`);
  }
  return number;
}
function requireNonNegativeInteger(value, label, fallback) {
  const number = requireNonNegativeNumber(value, label, fallback);
  if (!Number.isInteger(number)) {
    throw new ApiError(400, `${label} must be a whole number.`);
  }
  return number;
}
function cleanOptionalText(value) {
  const text2 = String(value ?? "").trim();
  return text2 || void 0;
}
function assertUniqueValues(rows, getValue, label) {
  const seen = /* @__PURE__ */ new Set();
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
function assertDatabaseIntegrity(database) {
  const tableEntries = Object.entries(database);
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
    if (!publishersById.has(book.publisher_id) || !categoriesById.has(book.category_id) || !subjectsById.has(book.subject_id) || !classesById.has(book.class_id)) {
      throw new ApiError(409, `Book ${book.book_number} is linked to missing master data.`);
    }
    if (book.purchase_cost < 0 || book.sale_price < 0 || book.reorder_level < 0) {
      throw new ApiError(409, `Book ${book.book_number} has invalid numeric values.`);
    }
  }
  for (const entry of database.stock_entries) {
    if (!booksById.has(entry.book_id) || !locationsById.has(entry.location_id) || !Number.isInteger(entry.quantity) || entry.quantity <= 0 || entry.unit_cost < 0) {
      throw new ApiError(409, `Stock entry ${entry.entry_number} is invalid.`);
    }
  }
  for (const balance of database.stock_balances) {
    if (!booksById.has(balance.book_id) || !locationsById.has(balance.location_id) || !Number.isInteger(balance.quantity) || balance.quantity < 0) {
      throw new ApiError(409, "A stock balance record is invalid.");
    }
  }
  for (const history of database.stock_history) {
    if (!booksById.has(history.book_id) || !locationsById.has(history.location_id) || !Number.isInteger(history.quantity_in) || history.quantity_in < 0 || !Number.isInteger(history.quantity_out) || history.quantity_out < 0 || !Number.isInteger(history.balance_after) || history.balance_after < 0) {
      throw new ApiError(409, "A stock history record is invalid.");
    }
  }
  for (const sale of database.sales) {
    if (!locationsById.has(sale.location_id) || sale.total_amount < 0 || sale.discount < 0) {
      throw new ApiError(409, `Sale ${sale.sale_number} is invalid.`);
    }
  }
  for (const item of database.sale_items) {
    if (!salesById.has(item.sale_id) || !booksById.has(item.book_id) || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.unit_price < 0 || item.discount < 0 || item.line_total < 0) {
      throw new ApiError(409, "A sale item record is invalid.");
    }
  }
  const validateBookLocationQuantity = (rows, label) => {
    for (const row of rows) {
      if (!booksById.has(row.book_id) || !locationsById.has(row.location_id) || !Number.isInteger(row.quantity) || row.quantity <= 0) {
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
    if (!booksById.has(row.book_id) || !locationsById.has(row.from_location_id) || !locationsById.has(row.to_location_id) || row.from_location_id === row.to_location_id || !Number.isInteger(row.quantity) || row.quantity <= 0) {
      throw new ApiError(409, `Transfer ${row.transfer_number} is invalid.`);
    }
  }
}
async function readDb(_forceRefresh = false) {
  let result;
  if (USE_LOCAL_DATABASE) {
    result = await readJsonDb();
  } else {
    await ensureBusinessStoreInitialized();
    const [
      pubs,
      locs,
      cats,
      subs,
      clss,
      bks,
      entries,
      balances,
      hist,
      sls,
      sitems,
      crets,
      prets,
      transfers,
      dmgs,
      logs
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
      db.select().from(live_logs)
    ]);
    result = normalizeDb({
      publishers: pubs,
      locations: locs,
      categories: cats,
      subjects: subs,
      classes: clss,
      books: bks,
      stock_entries: entries,
      stock_balances: balances,
      stock_history: hist,
      sales: sls,
      sale_items: sitems,
      customer_returns: crets,
      publisher_returns: prets,
      stock_transfers: transfers,
      damage_loss_records: dmgs,
      live_logs: logs
    });
  }
  assertDatabaseIntegrity(result);
  dbSnapshots.set(result, cloneDb(result));
  return result;
}
async function writeDb(data, tablesToSync) {
  const snapshot = dbSnapshots.get(data);
  if (!snapshot) {
    throw new ApiError(500, "Database write context is missing. Please refresh and try again.");
  }
  const runWrite = async () => {
    if (USE_LOCAL_DATABASE) {
      const current = await readJsonDb();
      const list2 = tablesToSync || Object.keys(current);
      for (const tableName of list2) {
        const beforeRows = snapshot[tableName] || [];
        const afterRows = data[tableName] || [];
        const currentRows = current[tableName] || [];
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
          const before = beforeById.get(row.id);
          const currentRow = currentById.get(row.id);
          if (!currentRow || canonicalRow(currentRow) !== canonicalRow(before)) {
            throw new ApiError(
              409,
              "This record was changed by another user. Refresh the page and try again."
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
              "This record was changed by another user. Refresh the page and try again."
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
        current[tableName] = Array.from(currentById.values());
        if (tableName === "live_logs") {
          current.live_logs.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
        }
      }
      assertDatabaseIntegrity(current);
      await writeJsonDb(current);
      dbSnapshots.delete(data);
      return;
    }
    const tablesMap = {
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
      live_logs
    };
    const list = tablesToSync || Object.keys(tablesMap);
    await db.transaction(async (tx) => {
      for (const tableName of list) {
        const table = tablesMap[tableName];
        if (!table) continue;
        const beforeRows = snapshot[tableName] || [];
        const afterRows = data[tableName] || [];
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
          const before = beforeById.get(row.id);
          const currentRows = await tx.select().from(table).where((0, import_drizzle_orm.eq)(table.id, row.id)).limit(1);
          const current = currentRows[0];
          if (!current || canonicalRow(current) !== canonicalRow(before)) {
            throw new ApiError(
              409,
              "This record was changed by another user. Refresh the page and try again."
            );
          }
          await tx.update(table).set(valuesWithoutId(row)).where((0, import_drizzle_orm.eq)(table.id, row.id));
        }
        for (const row of deletedRows) {
          const currentRows = await tx.select().from(table).where((0, import_drizzle_orm.eq)(table.id, row.id)).limit(1);
          const current = currentRows[0];
          if (!current) continue;
          if (canonicalRow(current) !== canonicalRow(row)) {
            throw new ApiError(
              409,
              "This record was changed by another user. Refresh the page and try again."
            );
          }
          await tx.delete(table).where((0, import_drizzle_orm.eq)(table.id, row.id));
        }
      }
    });
    dbSnapshots.delete(data);
  };
  writeQueue = writeQueue.then(runWrite, runWrite);
  await writeQueue;
}
function createLog(db2, module2, action, recordNumber, description, severity = "info") {
  const log = {
    id: makeId("log"),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    user: getCurrentActorEmail(),
    module: module2,
    action,
    record_number: recordNumber,
    description,
    severity
  };
  db2.live_logs.unshift(log);
}
app.use(
  "/api",
  requireAuth,
  authorizeBusinessApi,
  requestContextMiddleware
);
app.get(["/api/data", "/api/db"], async (req, res) => {
  try {
    const db2 = await readDb();
    res.json(db2);
  } catch (error) {
    sendError(res, error);
  }
});
app.get("/api/settings", async (_req, res) => {
  try {
    res.json(await readSettings());
  } catch (error) {
    sendError(res, error);
  }
});
app.put("/api/settings", async (req, res) => {
  try {
    const saved = await writeSettings(req.body);
    res.json(saved);
  } catch (error) {
    sendError(res, error);
  }
});
function updateStockBalance(db2, bookId, locationId, qtyDiff) {
  let balance = db2.stock_balances.find((b) => b.book_id === bookId && b.location_id === locationId);
  if (!balance) {
    balance = {
      id: makeId("bal"),
      book_id: bookId,
      location_id: locationId,
      quantity: 0
    };
    db2.stock_balances.push(balance);
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
function getStockBalance(db2, bookId, locationId) {
  const balance = db2.stock_balances.find((b) => b.book_id === bookId && b.location_id === locationId);
  return balance ? balance.quantity : 0;
}
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
    const newPublisher = {
      id: makeId("pub"),
      publisher_number: publisherNumber,
      publisher_name: publisherName,
      contact_person: String(req.body.contact_person || "").trim() || void 0,
      phone: String(req.body.phone || "").trim() || void 0,
      email: String(req.body.email || "").trim() || void 0,
      address: String(req.body.address || "").trim() || void 0,
      credit_days: Number.isFinite(creditDays) && creditDays >= 0 ? Math.floor(creditDays) : 30,
      status: req.body.status === "inactive" ? "inactive" : "active",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    database.publishers.push(newPublisher);
    createLog(database, "Publisher", "Create", publisherNumber, `Created publisher ${publisherName} (${publisherNumber})`);
    await writeDb(database, ["publishers", "live_logs"]);
    res.status(201).json(newPublisher);
  } catch (error) {
    sendError(res, error);
  }
});
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
    const creditDays = req.body.credit_days !== void 0 ? Number(req.body.credit_days) : publisher.credit_days;
    if (!Number.isFinite(creditDays) || creditDays < 0) {
      return res.status(400).json({ error: "Credit days must be 0 or greater." });
    }
    publisher.publisher_name = publisherName;
    publisher.contact_person = req.body.contact_person !== void 0 ? String(req.body.contact_person).trim() || void 0 : publisher.contact_person;
    publisher.phone = req.body.phone !== void 0 ? String(req.body.phone).trim() || void 0 : publisher.phone;
    publisher.email = req.body.email !== void 0 ? String(req.body.email).trim() || void 0 : publisher.email;
    publisher.address = req.body.address !== void 0 ? String(req.body.address).trim() || void 0 : publisher.address;
    publisher.credit_days = Math.floor(creditDays);
    publisher.status = req.body.status === "inactive" ? "inactive" : "active";
    createLog(database, "Publisher", "Update", publisher.publisher_number, `Updated publisher ${publisher.publisher_name}`);
    await writeDb(database, ["publishers", "live_logs"]);
    res.json(publisher);
  } catch (error) {
    sendError(res, error);
  }
});
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
    const newLocation = {
      id: makeId("loc"),
      code,
      name,
      type,
      city: String(req.body.city || "").trim() || void 0,
      address: String(req.body.address || "").trim() || void 0,
      contact_person: String(req.body.contact_person || "").trim() || void 0,
      phone: String(req.body.phone || "").trim() || void 0,
      status: req.body.status === "inactive" ? "inactive" : "active"
    };
    database.locations.push(newLocation);
    createLog(database, "Location", "Create", code, `Created location ${name} (${code})`);
    await writeDb(database, ["locations", "live_logs"]);
    res.status(201).json(newLocation);
  } catch (error) {
    sendError(res, error);
  }
});
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
    location.type = type;
    location.city = req.body.city !== void 0 ? String(req.body.city).trim() || void 0 : location.city;
    location.address = req.body.address !== void 0 ? String(req.body.address).trim() || void 0 : location.address;
    location.contact_person = req.body.contact_person !== void 0 ? String(req.body.contact_person).trim() || void 0 : location.contact_person;
    location.phone = req.body.phone !== void 0 ? String(req.body.phone).trim() || void 0 : location.phone;
    location.status = req.body.status === "inactive" ? "inactive" : "active";
    createLog(database, "Location", "Update", location.code, `Updated location ${location.name}`);
    await writeDb(database, ["locations", "live_logs"]);
    res.json(location);
  } catch (error) {
    sendError(res, error);
  }
});
function registerSimpleMasterRoutes(pathName, singularName, idPrefix) {
  app.post(`/api/${pathName}`, async (req, res) => {
    try {
      const database = await readDb();
      const items = database[pathName];
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ error: `${singularName} name is required.` });
      if (hasDuplicateName(items, name)) {
        return res.status(409).json({ error: `${singularName} already exists.` });
      }
      const record = {
        id: makeId(idPrefix),
        name,
        status: req.body.status === "inactive" ? "inactive" : "active"
      };
      items.push(record);
      createLog(database, singularName, "Create", `${idPrefix.toUpperCase()}-NEW`, `Created ${singularName.toLowerCase()} ${name}`);
      await writeDb(database, [pathName, "live_logs"]);
      res.status(201).json(record);
    } catch (error) {
      sendError(res, error);
    }
  });
  app.put(`/api/${pathName}/:id`, async (req, res) => {
    try {
      const database = await readDb();
      const items = database[pathName];
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
    } catch (error) {
      sendError(res, error);
    }
  });
}
registerSimpleMasterRoutes("categories", "Category", "cat");
registerSimpleMasterRoutes("subjects", "Subject", "sub");
registerSimpleMasterRoutes("classes", "Class", "cls");
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
      opening_stock_notes
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
        "Opening stock location not found."
      );
      if (location.status !== "active") {
        throw new ApiError(400, "Opening stock location must be active.");
      }
    }
    const bookNumber = nextCode(database.books, "book_number", "BK");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newBook = {
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
      created_at: now
    };
    database.books.push(newBook);
    createLog(database, "Book", "Create", bookNumber, `Created book "${cleanTitle}" (${bookNumber})`);
    if (openingQuantity > 0 && opening_stock_location_id) {
      const entryNumber = nextCode(database.stock_entries, "entry_number", "ENT");
      const stockNotes = cleanOptionalText(opening_stock_notes) || "Opening Stock during book registration";
      const newEntry = {
        id: makeId("stk-entry"),
        entry_number: entryNumber,
        date: now,
        book_id: newBook.id,
        location_id: opening_stock_location_id,
        quantity: openingQuantity,
        unit_cost: purchaseCost,
        reference_number: "OPENING",
        notes: stockNotes,
        created_at: now
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
        created_at: now
      });
    }
    await writeDb(database, ["books", "live_logs", "stock_entries", "stock_balances", "stock_history"]);
    res.status(201).json(newBook);
  } catch (error) {
    sendError(res, error);
  }
});
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
      items
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
    const rawItems = Array.isArray(items) && items.length > 0 ? items : [{ book_id, quantity, unit_cost, sale_price }];
    if (rawItems.length === 0) {
      throw new ApiError(400, "Please add at least one book.");
    }
    const seenBookIds = /* @__PURE__ */ new Set();
    const preparedItems = rawItems.map((item, index) => {
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
      const hasSalePrice = item.sale_price !== void 0 && item.sale_price !== null && item.sale_price !== "";
      const itemSalePrice = hasSalePrice ? requireNonNegativeNumber(item.sale_price, `Sale price for ${book.title}`) : void 0;
      return { book, itemBookId, itemQuantity, itemUnitCost, hasSalePrice, itemSalePrice };
    });
    const createdEntries = [];
    const createdHistory = [];
    let totalQuantity = 0;
    let salePriceUpdatedCount = 0;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const movementDate = cleanOptionalText(date) || now;
    const cleanReference = cleanOptionalText(reference_number);
    const cleanNotes = cleanOptionalText(notes);
    const cleanSetName = cleanOptionalText(set_name) || "Unnamed Set";
    const isGroupedPurchase = ["set", "pair", "bundle"].includes(String(purchase_type || "").toLowerCase());
    for (const item of preparedItems) {
      if (item.hasSalePrice && item.itemSalePrice !== void 0) {
        item.book.sale_price = item.itemSalePrice;
        salePriceUpdatedCount += 1;
      }
      const entryNumber = nextCode(database.stock_entries, "entry_number", "ENT");
      const finalNotes = [
        cleanNotes,
        isGroupedPurchase ? `Set/Pair: ${cleanSetName}` : void 0,
        item.hasSalePrice && item.itemSalePrice !== void 0 ? `Sale Price Updated: ${item.itemSalePrice}` : void 0
      ].filter(Boolean).join(" | ");
      const newEntry = {
        id: makeId("stk-entry"),
        entry_number: entryNumber,
        date: movementDate,
        book_id: item.itemBookId,
        location_id,
        quantity: item.itemQuantity,
        unit_cost: item.itemUnitCost,
        reference_number: cleanReference,
        notes: finalNotes || void 0,
        created_at: now
      };
      database.stock_entries.push(newEntry);
      const finalBalance = updateStockBalance(database, item.itemBookId, location_id, item.itemQuantity);
      const newHistory = {
        id: makeId("stk-hist"),
        date: movementDate,
        book_id: item.itemBookId,
        location_id,
        movement_type: "Add Stock",
        quantity_in: item.itemQuantity,
        quantity_out: 0,
        balance_after: finalBalance,
        reference_number: cleanReference || entryNumber,
        notes: finalNotes || void 0,
        created_at: now
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
      isGroupedPurchase ? `Added ${totalQuantity} total units from set/pair "${cleanSetName}"${salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""}` : `Added ${totalQuantity} total stock units${salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""}`
    );
    await writeDb(database, ["books", "stock_entries", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json({
      message: "Stock added successfully.",
      entries: createdEntries,
      history: createdHistory,
      total_quantity: totalQuantity,
      sale_price_updated_count: salePriceUpdatedCount
    });
  } catch (error) {
    sendError(res, error);
  }
});
app.post("/api/sales", async (req, res) => {
  try {
    const database = await readDb();
    const locationId = String(req.body.location_id || "");
    if (!locationId || !database.locations.some((item) => item.id === locationId && item.status === "active")) {
      return res.status(400).json({ error: "A valid active selling location is required." });
    }
    const submittedItems = Array.isArray(req.body.items) && req.body.items.length > 0 ? req.body.items : [{ book_id: req.body.book_id, quantity: req.body.quantity, sale_price: req.body.sale_price }];
    const combined = /* @__PURE__ */ new Map();
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
        throw new ApiError(400, `Insufficient stock for "${book.title}". Only ${available} unit(s) are available.`);
      }
      const gross = item.quantity * item.sale_price;
      subtotal += gross;
      return { ...item, book, gross };
    });
    const discount = Number(req.body.discount) || 0;
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
      return res.status(400).json({ error: "Discount must be between 0 and the sale subtotal." });
    }
    const paymentMethod = ["Cash", "Bank", "Credit"].includes(req.body.payment_method) ? req.body.payment_method : "Cash";
    const saleNumber = nextPlainCode(database.sales, "sale_number", "SL");
    const totalAmount = subtotal - discount;
    const newSale = {
      id: makeId("sale"),
      sale_number: saleNumber,
      date: req.body.date || (/* @__PURE__ */ new Date()).toISOString(),
      location_id: locationId,
      customer_name: String(req.body.customer_name || "").trim() || void 0,
      payment_method: paymentMethod,
      notes: String(req.body.notes || "").trim() || void 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      total_amount: totalAmount,
      discount
    };
    database.sales.push(newSale);
    let allocatedDiscount = 0;
    const createdItems = [];
    validatedItems.forEach((item, index) => {
      const itemDiscount = index === validatedItems.length - 1 ? discount - allocatedDiscount : subtotal > 0 ? Number((item.gross / subtotal * discount).toFixed(2)) : 0;
      allocatedDiscount += itemDiscount;
      const saleItem = {
        id: makeId("sitem"),
        sale_id: newSale.id,
        book_id: item.book_id,
        quantity: item.quantity,
        unit_price: item.sale_price,
        discount: itemDiscount,
        line_total: item.gross - itemDiscount
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
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    });
    const totalUnits = validatedItems.reduce((sum, item) => sum + item.quantity, 0);
    createLog(database, "Sales", "Sale", saleNumber, `Sold ${totalUnits} unit(s) across ${createdItems.length} book(s) for total ${totalAmount}`);
    await writeDb(database, ["sales", "sale_items", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json({ ...newSale, items: createdItems });
  } catch (error) {
    sendError(res, error);
  }
});
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
      const soldQuantity = database.sale_items.filter((item) => item.sale_id === originalSale.id && item.book_id === bookId).reduce((sum, item) => sum + Number(item.quantity), 0);
      if (soldQuantity <= 0) {
        return res.status(400).json({ error: "The selected book is not part of the original sale." });
      }
      const alreadyReturned = database.customer_returns.filter((item) => item.original_sale_number?.toLowerCase() === originalSale.sale_number.toLowerCase() && item.book_id === bookId && item.location_id === locationId).reduce((sum, item) => sum + Number(item.quantity), 0);
      if (alreadyReturned + quantity > soldQuantity) {
        return res.status(400).json({ error: `Only ${Math.max(0, soldQuantity - alreadyReturned)} unit(s) remain returnable for this sale.` });
      }
    }
    const returnNumber = nextPlainCode(database.customer_returns, "return_number", "RET");
    const newReturn = {
      id: makeId("cret"),
      return_number: returnNumber,
      date: req.body.date || (/* @__PURE__ */ new Date()).toISOString(),
      customer_name: String(req.body.customer_name || "").trim() || void 0,
      original_sale_number: originalSaleNumber || void 0,
      book_id: bookId,
      location_id: locationId,
      quantity,
      reason,
      notes: String(req.body.notes || "").trim() || void 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
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
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    createLog(database, "Returns", "Customer Return", returnNumber, `Received return of ${quantity} unit(s) of "${book.title}"`);
    await writeDb(database, ["customer_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error) {
    sendError(res, error);
  }
});
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
      return res.status(400).json({ error: `"${book.title}" does not belong to the selected publisher.` });
    }
    const returnLocation = database.locations.find((item) => item.id === locationId);
    if (!returnLocation) return res.status(404).json({ error: "Location not found." });
    if (returnLocation.status !== "active") throw new ApiError(400, "Return location must be active.");
    const available = getStockBalance(database, bookId, locationId);
    if (quantity > available) {
      return res.status(400).json({ error: `Insufficient stock. Only ${available} unit(s) are available.` });
    }
    const returnNumber = nextPlainCode(database.publisher_returns, "return_number", "PRT");
    const newReturn = {
      id: makeId("pret"),
      return_number: returnNumber,
      date: req.body.date || (/* @__PURE__ */ new Date()).toISOString(),
      publisher_id: publisherId,
      book_id: bookId,
      location_id: locationId,
      quantity,
      reason,
      notes: String(req.body.notes || "").trim() || void 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
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
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    createLog(database, "Returns", "Publisher Return", returnNumber, `Returned ${quantity} unit(s) of "${book.title}" to ${publisher.publisher_name}`);
    await writeDb(database, ["publisher_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error) {
    sendError(res, error);
  }
});
app.post("/api/stock-transfers", async (req, res) => {
  try {
    const db2 = await readDb();
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
    const sourceLocation = db2.locations.find((location) => location.id === from_location_id);
    const destinationLocation = db2.locations.find((location) => location.id === to_location_id);
    if (!sourceLocation) return res.status(404).json({ error: "Source location not found." });
    if (!destinationLocation) return res.status(404).json({ error: "Destination location not found." });
    if (sourceLocation.status !== "active" || destinationLocation.status !== "active") {
      throw new ApiError(400, "Source and destination locations must both be active.");
    }
    const available = getStockBalance(db2, book_id, from_location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Source location only has ${available} units.` });
    }
    const book = db2.books.find((b) => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    if (book.status !== "active") throw new ApiError(400, "Selected book is inactive.");
    const transfer_number = nextPlainCode(db2.stock_transfers, "transfer_number", "TRN");
    const newTransfer = {
      id: makeId("trn"),
      transfer_number,
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      from_location_id,
      to_location_id,
      book_id,
      quantity: qty,
      notes: cleanOptionalText(notes),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.stock_transfers.push(newTransfer);
    const finalSourceBalance = updateStockBalance(db2, book_id, from_location_id, -qty);
    const finalDestBalance = updateStockBalance(db2, book_id, to_location_id, qty);
    db2.stock_history.push({
      id: makeId("stk-hist"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id: from_location_id,
      movement_type: "Transfer Out",
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalSourceBalance,
      reference_number: transfer_number,
      notes: `Transferred to ${db2.locations.find((l) => l.id === to_location_id)?.name || "another location"}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    db2.stock_history.push({
      id: makeId("stk-hist"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id: to_location_id,
      movement_type: "Transfer In",
      quantity_in: qty,
      quantity_out: 0,
      balance_after: finalDestBalance,
      reference_number: transfer_number,
      notes: `Transferred from ${db2.locations.find((l) => l.id === from_location_id)?.name || "another location"}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    createLog(db2, "Transfers", "Transfer", transfer_number, `Transferred ${qty} units of "${book.title}"`);
    await writeDb(db2, ["stock_transfers", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newTransfer);
  } catch (error) {
    sendError(res, error);
  }
});
app.post("/api/damage-loss", async (req, res) => {
  try {
    const db2 = await readDb();
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
    const damageLocation = db2.locations.find((location) => location.id === location_id);
    if (!damageLocation) return res.status(404).json({ error: "Location not found." });
    if (damageLocation.status !== "active") throw new ApiError(400, "Selected location is inactive.");
    const available = getStockBalance(db2, book_id, location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }
    const book = db2.books.find((b) => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    if (book.status !== "active") throw new ApiError(400, "Selected book is inactive.");
    const newRecord = {
      id: makeId("dmg"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: cleanOptionalText(notes),
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.damage_loss_records.push(newRecord);
    const finalBalance = updateStockBalance(db2, book_id, location_id, -qty);
    const movement_type = reason === "Damage" ? "Damage" : reason === "Loss" ? "Loss" : "Correction";
    const newHist = {
      id: makeId("stk-hist"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id,
      movement_type,
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalBalance,
      reference_number: "DMG-LOSS",
      notes: `Damage/Loss: ${reason}. Notes: ${notes || ""}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.stock_history.push(newHist);
    createLog(db2, "Damage/Loss", "Correction", "DMG-LOSS", `Logged ${reason} for ${qty} units of "${book.title}"`);
    await writeDb(db2, ["damage_loss_records", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newRecord);
  } catch (error) {
    sendError(res, error);
  }
});
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
      stock_notes
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
      DEFAULT_SETTINGS.globalReorderLevel
    );
    const publisherCreditDays = requireNonNegativeInteger(publisher_credit_days, "Publisher credit days", 30);
    const location = ensureExists(database.locations, (item) => item.id === location_id, "Stock location not found.");
    if (location.status !== "active") {
      throw new ApiError(400, "Stock location must be active.");
    }
    const cleanBarcode = cleanOptionalText(barcode);
    const cleanIsbn = cleanOptionalText(ISBN);
    if (cleanBarcode && database.books.some((book2) => book2.barcode === cleanBarcode)) {
      throw new ApiError(409, "Another book already uses this barcode.");
    }
    if (cleanIsbn && database.books.some((book2) => book2.ISBN === cleanIsbn)) {
      throw new ApiError(409, "Another book already uses this ISBN.");
    }
    const created = [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const resolvePublisher = () => {
      if (publisher_id) {
        const record2 = ensureExists(database.publishers, (item) => item.id === publisher_id, "Publisher not found.");
        if (record2.status !== "active") throw new ApiError(400, "Selected publisher is inactive.");
        return record2.id;
      }
      const name = String(publisher_name || "").trim();
      if (!name) throw new ApiError(400, "Publisher is required.");
      const existing = database.publishers.find(
        (item) => item.publisher_name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
      );
      if (existing) {
        if (existing.status !== "active") throw new ApiError(400, "A publisher with this name exists but is inactive.");
        return existing.id;
      }
      const publisherNumber = nextCode(database.publishers, "publisher_number", "PUB");
      const record = {
        id: makeId("pub"),
        publisher_number: publisherNumber,
        publisher_name: name,
        phone: cleanOptionalText(publisher_phone),
        credit_days: publisherCreditDays,
        status: "active",
        created_at: now
      };
      database.publishers.push(record);
      created.push(`Publisher: ${record.publisher_name}`);
      createLog(database, "Publisher", "Create", publisherNumber, `Created publisher ${record.publisher_name} (${publisherNumber})`);
      return record.id;
    };
    const resolveNamedMaster = (records, selectedId, enteredName, label, idPrefix) => {
      if (selectedId) {
        const record2 = ensureExists(records, (item) => item.id === selectedId, `${label} not found.`);
        if (record2.status !== "active") throw new ApiError(400, `Selected ${label.toLowerCase()} is inactive.`);
        return record2.id;
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
      const record = { id: makeId(idPrefix), name, status: "active" };
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
    const book = {
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
      created_at: now
    };
    database.books.push(book);
    created.push(`Book: ${book.title}`);
    createLog(database, "Book", "Create", bookNumber, `Created book "${book.title}" (${bookNumber})`);
    const entryNumber = nextCode(database.stock_entries, "entry_number", "ENT");
    const movementDate = cleanOptionalText(stock_date) || now;
    const stockReference = cleanOptionalText(stock_reference_number) || "SMART-ENTRY";
    const finalStockNotes = cleanOptionalText(stock_notes) || `Smart-entry stock received for ${book.title}`;
    const stockEntry = {
      id: makeId("stk-entry"),
      entry_number: entryNumber,
      date: movementDate,
      book_id: book.id,
      location_id,
      quantity,
      unit_cost: purchaseCost,
      reference_number: stockReference,
      notes: finalStockNotes,
      created_at: now
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
      created_at: now
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
      "live_logs"
    ]);
    res.status(201).json({ book, stockEntry, created });
  } catch (error) {
    sendError(res, error);
  }
});
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
      notes
    } = req.body;
    const book = ensureExists(database.books, (item) => item.id === id, "Book not found.");
    if (title !== void 0 && !String(title).trim()) {
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
    const cleanBarcode = barcode !== void 0 ? cleanOptionalText(barcode) : book.barcode;
    const cleanIsbn = ISBN !== void 0 ? cleanOptionalText(ISBN) : book.ISBN;
    if (cleanBarcode && database.books.some((item) => item.id !== id && item.barcode === cleanBarcode)) {
      throw new ApiError(409, "Another book already uses this barcode.");
    }
    if (cleanIsbn && database.books.some((item) => item.id !== id && item.ISBN === cleanIsbn)) {
      throw new ApiError(409, "Another book already uses this ISBN.");
    }
    book.title = title !== void 0 ? String(title).trim() : book.title;
    book.barcode = cleanBarcode;
    book.ISBN = cleanIsbn;
    book.publisher_id = publisher_id || book.publisher_id;
    book.category_id = category_id || book.category_id;
    book.subject_id = subject_id || book.subject_id;
    book.class_id = class_id || book.class_id;
    book.purchase_cost = purchase_cost !== void 0 ? requireNonNegativeNumber(purchase_cost, "Purchase cost") : book.purchase_cost;
    book.sale_price = sale_price !== void 0 ? requireNonNegativeNumber(sale_price, "Sale price") : book.sale_price;
    book.reorder_level = reorder_level !== void 0 ? requireNonNegativeInteger(reorder_level, "Reorder level") : book.reorder_level;
    book.cover_image = cover_image !== void 0 ? cleanOptionalText(cover_image) : book.cover_image;
    book.status = status !== void 0 ? status === "inactive" ? "inactive" : "active" : book.status;
    book.notes = notes !== void 0 ? cleanOptionalText(notes) : book.notes;
    createLog(database, "Book", "Update", book.book_number, `Updated book "${book.title}"`);
    await writeDb(database, ["books", "live_logs"]);
    res.json(book);
  } catch (error) {
    sendError(res, error);
  }
});
app.delete("/api/books/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const bookIndex = db2.books.findIndex((b) => b.id === id);
    if (bookIndex === -1) {
      return res.status(404).json({ error: "Book not found." });
    }
    const book = db2.books[bookIndex];
    const hasHistory = db2.stock_history.some((h) => h.book_id === id);
    const hasSales = db2.sale_items.some((s) => s.book_id === id);
    const hasCustReturns = db2.customer_returns.some((r) => r.book_id === id);
    const hasPubReturns = db2.publisher_returns.some((r) => r.book_id === id);
    const hasTransfers = db2.stock_transfers.some((t) => t.book_id === id);
    const hasDamageLoss = db2.damage_loss_records.some((d) => d.book_id === id);
    if (hasHistory || hasSales || hasCustReturns || hasPubReturns || hasTransfers || hasDamageLoss) {
      return res.status(400).json({ error: "Book has active transactions. Deactivate it instead." });
    }
    db2.books.splice(bookIndex, 1);
    createLog(db2, "Book", "Delete", book.book_number, `Deleted book "${book.title}"`);
    await writeDb(db2, ["books", "live_logs"]);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
});
app.delete("/api/publishers/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const pubIndex = db2.publishers.findIndex((p) => p.id === id);
    if (pubIndex === -1) {
      return res.status(404).json({ error: "Publisher not found." });
    }
    const publisher = db2.publishers[pubIndex];
    const hasBooks = db2.books.some((b) => b.publisher_id === id);
    const hasReturns = db2.publisher_returns.some((r) => r.publisher_id === id);
    if (hasBooks || hasReturns) {
      return res.status(400).json({ error: "Publisher is linked to existing books/returns. Deactivate it instead." });
    }
    db2.publishers.splice(pubIndex, 1);
    createLog(db2, "Publisher", "Delete", publisher.publisher_number, `Deleted publisher "${publisher.publisher_name}"`);
    await writeDb(db2, ["publishers", "live_logs"]);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
});
app.delete("/api/locations/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const locIndex = db2.locations.findIndex((l) => l.id === id);
    if (locIndex === -1) {
      return res.status(404).json({ error: "Location not found." });
    }
    const location = db2.locations[locIndex];
    const hasStock = db2.stock_balances.some((b) => b.location_id === id && b.quantity > 0);
    const hasHistory = db2.stock_history.some((h) => h.location_id === id);
    const hasSales = db2.sales.some((s) => s.location_id === id);
    const hasCustReturns = db2.customer_returns.some((r) => r.location_id === id);
    const hasPubReturns = db2.publisher_returns.some((r) => r.location_id === id);
    const hasTransfers = db2.stock_transfers.some((t) => t.from_location_id === id || t.to_location_id === id);
    const hasDamageLoss = db2.damage_loss_records.some((d) => d.location_id === id);
    if (hasStock || hasHistory || hasSales || hasCustReturns || hasPubReturns || hasTransfers || hasDamageLoss) {
      return res.status(400).json({ error: "Location has active stock or historical transactions. Deactivate it instead." });
    }
    db2.locations.splice(locIndex, 1);
    createLog(db2, "Location", "Delete", location.code, `Deleted location "${location.name}"`);
    await writeDb(db2, ["locations", "live_logs"]);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
});
app.delete("/api/categories/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const catIndex = db2.categories.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      return res.status(404).json({ error: "Category not found." });
    }
    const cat = db2.categories[catIndex];
    const hasBooks = db2.books.some((b) => b.category_id === id);
    if (hasBooks) {
      return res.status(400).json({ error: "Category has books assigned to it. Deactivate it instead." });
    }
    db2.categories.splice(catIndex, 1);
    createLog(db2, "Category", "Delete", "CAT-DEL", `Deleted category "${cat.name}"`);
    await writeDb(db2, ["categories", "live_logs"]);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
});
app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const subIndex = db2.subjects.findIndex((s) => s.id === id);
    if (subIndex === -1) {
      return res.status(404).json({ error: "Subject not found." });
    }
    const sub = db2.subjects[subIndex];
    const hasBooks = db2.books.some((b) => b.subject_id === id);
    if (hasBooks) {
      return res.status(400).json({ error: "Subject has books assigned to it. Deactivate it instead." });
    }
    db2.subjects.splice(subIndex, 1);
    createLog(db2, "Subject", "Delete", "SUB-DEL", `Deleted subject "${sub.name}"`);
    await writeDb(db2, ["subjects", "live_logs"]);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
});
app.delete("/api/classes/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const clsIndex = db2.classes.findIndex((c) => c.id === id);
    if (clsIndex === -1) {
      return res.status(404).json({ error: "Class not found." });
    }
    const cls = db2.classes[clsIndex];
    const hasBooks = db2.books.some((b) => b.class_id === id);
    if (hasBooks) {
      return res.status(400).json({ error: "Class has books assigned to it. Deactivate it instead." });
    }
    db2.classes.splice(clsIndex, 1);
    createLog(db2, "Class", "Delete", "CLS-DEL", `Deleted class "${cls.name}"`);
    await writeDb(db2, ["classes", "live_logs"]);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
});
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }
  if (!req.path.startsWith("/api")) {
    return next(error);
  }
  const message = process.env.NODE_ENV === "production" ? "The request could not be completed." : error?.message || "The request could not be completed.";
  return res.status(error?.status || 500).json({ error: message });
});
async function startLocalServer() {
  await ensureApplicationStoresInitialized();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(
      "/assets",
      import_express2.default.static(import_path2.default.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true
      })
    );
    app.use(
      import_express2.default.static(distPath, {
        maxAge: "1h"
      })
    );
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
var isVercelRuntime = Boolean(process.env.VERCEL);
if (!isVercelRuntime) {
  void startLocalServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exitCode = 1;
  });
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app,
  ensureApplicationStoresInitialized,
  ensureAuthStoreInitialized
});
