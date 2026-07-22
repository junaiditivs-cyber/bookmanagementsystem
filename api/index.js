var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import path2 from "path";
import fs2 from "fs/promises";
import { randomUUID as randomUUID2 } from "crypto";

// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";

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
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp
} from "drizzle-orm/pg-core";
var appUsers = pgTable(
  "app_users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    passwordHistory: jsonb("password_history").notNull().default([]),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    mustChangePassword: boolean(
      "must_change_password"
    ).notNull().default(true),
    failedLoginAttempts: integer(
      "failed_login_attempts"
    ).notNull().default(0),
    lockedUntil: timestamp(
      "locked_until",
      {
        withTimezone: true
      }
    ),
    sessionVersion: integer("session_version").notNull().default(1),
    lastLoginAt: timestamp(
      "last_login_at",
      {
        withTimezone: true
      }
    ),
    passwordChangedAt: timestamp(
      "password_changed_at",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by")
  }
);
var authAuditLogs = pgTable(
  "auth_audit_logs",
  {
    id: text("id").primaryKey(),
    timestamp: timestamp(
      "timestamp",
      {
        withTimezone: true
      }
    ).notNull().defaultNow(),
    actorUserId: text("actor_user_id"),
    actorEmail: text("actor_email").notNull(),
    action: text("action").notNull(),
    targetUserId: text("target_user_id"),
    targetEmail: text("target_email"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    result: text("result").notNull(),
    details: text("details").notNull().default("")
  }
);
var users = appUsers;
var publishers = pgTable("publishers", {
  id: text("id").primaryKey(),
  publisher_number: text("publisher_number").notNull().unique(),
  publisher_name: text("publisher_name").notNull(),
  contact_person: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  credit_days: integer("credit_days").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
  created_at: text("created_at").notNull()
});
var locations = pgTable("locations", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  city: text("city"),
  address: text("address"),
  contact_person: text("contact_person"),
  phone: text("phone"),
  status: text("status").notNull()
});
var categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull()
});
var subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull()
});
var classes = pgTable("classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull()
});
var books = pgTable("books", {
  id: text("id").primaryKey(),
  book_number: text("book_number").notNull().unique(),
  title: text("title").notNull(),
  barcode: text("barcode").unique(),
  ISBN: text("ISBN").unique(),
  publisher_id: text("publisher_id").notNull().references(
    () => publishers.id
  ),
  category_id: text("category_id").notNull().references(
    () => categories.id
  ),
  subject_id: text("subject_id").notNull().references(
    () => subjects.id
  ),
  class_id: text("class_id").notNull().references(
    () => classes.id
  ),
  purchase_cost: real("purchase_cost").notNull(),
  sale_price: real("sale_price").notNull(),
  reorder_level: integer("reorder_level").notNull(),
  cover_image: text("cover_image"),
  status: text("status").notNull(),
  notes: text("notes"),
  created_at: text("created_at").notNull()
});
var stock_entries = pgTable("stock_entries", {
  id: text("id").primaryKey(),
  entry_number: text("entry_number").notNull().unique(),
  date: text("date").notNull(),
  book_id: text("book_id").notNull().references(
    () => books.id
  ),
  location_id: text("location_id").notNull().references(
    () => locations.id
  ),
  quantity: integer("quantity").notNull(),
  unit_cost: real("unit_cost").notNull(),
  reference_number: text("reference_number"),
  notes: text("notes"),
  created_at: text("created_at").notNull()
});
var stock_balances = pgTable("stock_balances", {
  id: text("id").primaryKey(),
  book_id: text("book_id").notNull().references(
    () => books.id
  ),
  location_id: text("location_id").notNull().references(
    () => locations.id
  ),
  quantity: integer("quantity").notNull()
});
var stock_history = pgTable("stock_history", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  book_id: text("book_id").notNull().references(
    () => books.id
  ),
  location_id: text("location_id").notNull().references(
    () => locations.id
  ),
  movement_type: text("movement_type").notNull(),
  quantity_in: integer("quantity_in").notNull(),
  quantity_out: integer("quantity_out").notNull(),
  balance_after: integer("balance_after").notNull(),
  reference_number: text("reference_number"),
  notes: text("notes"),
  created_at: text("created_at").notNull()
});
var sales = pgTable("sales", {
  id: text("id").primaryKey(),
  sale_number: text("sale_number").notNull().unique(),
  date: text("date").notNull(),
  location_id: text("location_id").notNull().references(
    () => locations.id
  ),
  customer_name: text("customer_name"),
  payment_method: text("payment_method").notNull(),
  notes: text("notes"),
  created_at: text("created_at").notNull(),
  total_amount: real("total_amount").notNull(),
  discount: real("discount").notNull()
});
var sale_items = pgTable("sale_items", {
  id: text("id").primaryKey(),
  sale_id: text("sale_id").notNull().references(
    () => sales.id
  ),
  book_id: text("book_id").notNull().references(
    () => books.id
  ),
  quantity: integer("quantity").notNull(),
  unit_price: real("unit_price").notNull(),
  discount: real("discount").notNull(),
  line_total: real("line_total").notNull()
});
var customer_returns = pgTable(
  "customer_returns",
  {
    id: text("id").primaryKey(),
    return_number: text("return_number").notNull().unique(),
    date: text("date").notNull(),
    customer_name: text("customer_name"),
    original_sale_number: text(
      "original_sale_number"
    ),
    book_id: text("book_id").notNull().references(
      () => books.id
    ),
    location_id: text("location_id").notNull().references(
      () => locations.id
    ),
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull(),
    notes: text("notes"),
    created_at: text("created_at").notNull()
  }
);
var publisher_returns = pgTable(
  "publisher_returns",
  {
    id: text("id").primaryKey(),
    return_number: text("return_number").notNull().unique(),
    date: text("date").notNull(),
    publisher_id: text("publisher_id").notNull().references(
      () => publishers.id
    ),
    book_id: text("book_id").notNull().references(
      () => books.id
    ),
    location_id: text("location_id").notNull().references(
      () => locations.id
    ),
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull(),
    notes: text("notes"),
    created_at: text("created_at").notNull()
  }
);
var stock_transfers = pgTable(
  "stock_transfers",
  {
    id: text("id").primaryKey(),
    transfer_number: text("transfer_number").notNull().unique(),
    date: text("date").notNull(),
    from_location_id: text(
      "from_location_id"
    ).notNull().references(
      () => locations.id
    ),
    to_location_id: text(
      "to_location_id"
    ).notNull().references(
      () => locations.id
    ),
    book_id: text("book_id").notNull().references(
      () => books.id
    ),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    created_at: text("created_at").notNull()
  }
);
var damage_loss_records = pgTable(
  "damage_loss_records",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    book_id: text("book_id").notNull().references(
      () => books.id
    ),
    location_id: text("location_id").notNull().references(
      () => locations.id
    ),
    quantity: integer("quantity").notNull(),
    reason: text("reason").notNull(),
    notes: text("notes"),
    created_at: text("created_at").notNull()
  }
);
var live_logs = pgTable("live_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  user: text("user").notNull(),
  module: text("module").notNull(),
  action: text("action").notNull(),
  record_number: text("record_number").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull()
});

// src/db/index.ts
var { Pool } = pkg;
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
var db = drizzle(pool, {
  schema: schema_exports
});

// server/auth/routes.ts
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// server/auth/store.ts
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
var DATABASE_MODE2 = (process.env.DATABASE_MODE || "local").toLowerCase();
var USE_LOCAL_AUTH_STORE = DATABASE_MODE2 === "local";
var AUTH_DATA_PATH = path.join(
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
    const raw = await fs.readFile(
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
  await fs.writeFile(
    tmpPath,
    JSON.stringify(nextData, null, 2),
    {
      mode: 384
    }
  );
  await fs.rename(
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
      await fs.access(
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
    id: input.id || randomUUID(),
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
    id: log.id || randomUUID(),
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
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from "crypto";
var KEY_LENGTH = 64;
var SCRYPT_COST = 16384;
var SCRYPT_BLOCK_SIZE = 8;
var SCRYPT_PARALLELIZATION = 1;
var SIMPLE_PASSWORD_MIN_LENGTH = 6;
var SIMPLE_PASSWORD_MAX_LENGTH = 128;
function deriveKey(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
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
  const salt = randomBytes(16);
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
    return expectedHash.length === actualHash.length && timingSafeEqual(expectedHash, actualHash);
  } catch {
    return false;
  }
}
function generateTemporaryPassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const targetLength = Math.max(8, length);
  return Array.from({ length: targetLength }, () => {
    return alphabet[randomBytes(1)[0] % alphabet.length];
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
import {
  createHmac,
  timingSafeEqual as timingSafeEqual2
} from "crypto";
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
  return createHmac(
    "sha256",
    getTokenSecret()
  ).update(value).digest("base64url");
}
function signaturesMatch(expected, received) {
  try {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual2(
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
var authRouter = Router();
var usersRouter = Router();
var MAX_FAILED_LOGIN_ATTEMPTS = 5;
var ACCOUNT_LOCK_MS = 15 * 60 * 1e3;
var ALLOWED_EMAIL_DOMAIN = "mjkhan.com";
var ALLOWED_EMAIL_SUFFIX = `@${ALLOWED_EMAIL_DOMAIN}`;
var ALLOWED_EMAIL_ERROR = `Only ${ALLOWED_EMAIL_SUFFIX} email addresses are allowed.`;
function isAllowedEmail(email) {
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_SUFFIX);
}
var allowedEmailSchema = z.string().trim().email().max(254).refine(isAllowedEmail, {
  message: ALLOWED_EMAIL_ERROR
});
var loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." }
});
var loginSchema = z.object({
  email: allowedEmailSchema,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false)
});
var changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(1).max(128),
  confirmPassword: z.string().min(1).max(128)
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "New password and confirmation do not match.",
  path: ["confirmPassword"]
});
var createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: allowedEmailSchema,
  role: z.enum(USER_ROLES),
  password: z.string().max(128).optional(),
  generatePassword: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(true)
});
var updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: allowedEmailSchema,
  role: z.enum(USER_ROLES),
  status: z.enum(["active", "inactive"]),
  mustChangePassword: z.boolean().optional()
});
var resetPasswordSchema = z.object({
  password: z.string().max(128).optional(),
  generatePassword: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(true)
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
import {
  AsyncLocalStorage
} from "async_hooks";
var requestContext = new AsyncLocalStorage();
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
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
var DB_PATH = path2.join(process.cwd(), "db.json");
var SETTINGS_PATH = path2.join(process.cwd(), "settings.json");
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
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json({ limit: "10mb" }));
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
    await ensureAuthStoreInitialized();
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
var cachedDb = null;
var writeQueue = Promise.resolve();
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
async function readJsonDb() {
  try {
    const raw = await fs2.readFile(DB_PATH, "utf8");
    return normalizeDb(JSON.parse(raw));
  } catch {
    return normalizeDb(EMPTY_DB);
  }
}
async function writeJsonDb(data) {
  const tmpPath = `${DB_PATH}.tmp`;
  await fs2.writeFile(tmpPath, JSON.stringify(normalizeDb(data), null, 2));
  await fs2.rename(tmpPath, DB_PATH);
}
async function readSettings() {
  try {
    const raw = await fs2.readFile(SETTINGS_PATH, "utf8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
async function writeSettings(settings) {
  const safeSettings = {
    businessName: String(settings.businessName || DEFAULT_SETTINGS.businessName),
    currency: String(settings.currency || DEFAULT_SETTINGS.currency),
    taxRate: Number(settings.taxRate) || 0,
    globalReorderLevel: Number(settings.globalReorderLevel) || DEFAULT_SETTINGS.globalReorderLevel
  };
  await fs2.writeFile(SETTINGS_PATH, JSON.stringify(safeSettings, null, 2));
  return safeSettings;
}
function makeId(prefix) {
  return `${prefix}-${randomUUID2()}`;
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
async function readDb(forceRefresh = false) {
  if (cachedDb && !forceRefresh) {
    return cachedDb;
  }
  if (USE_LOCAL_DATABASE) {
    cachedDb = await readJsonDb();
    return cachedDb;
  }
  try {
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
    cachedDb = normalizeDb({
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
    return cachedDb;
  } catch (error) {
    console.warn("Cloud SQL/Supabase read failed. Using local db.json fallback.", error);
    cachedDb = await readJsonDb();
    return cachedDb;
  }
}
async function writeDb(data, tablesToSync) {
  const runWrite = async () => {
    if (USE_LOCAL_DATABASE) {
      await writeJsonDb(data);
      cachedDb = data;
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
    try {
      await db.transaction(async (tx) => {
        for (const tName of list) {
          const table = tablesMap[tName];
          if (!table) continue;
          await tx.delete(table);
          const rows = cachedDb[tName];
          if (rows && rows.length > 0) {
            await tx.insert(table).values(rows);
          }
        }
      });
    } catch (error) {
      console.warn("Cloud SQL/Supabase write failed. Saving to local db.json fallback.", error);
      await writeJsonDb(cachedDb);
    }
  };
  writeQueue = writeQueue.then(runWrite, runWrite);
  await writeQueue;
}
function createLog(db2, module, action, recordNumber, description, severity = "info") {
  const log = {
    id: makeId("log"),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    user: getCurrentActorEmail(),
    module,
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
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/settings", async (_req, res) => {
  try {
    res.json(await readSettings());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/settings", async (req, res) => {
  try {
    const saved = await writeSettings(req.body);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  const nextQuantity = balance.quantity + qtyDiff;
  if (nextQuantity < 0) {
    throw new Error(`Insufficient stock. Current balance is ${balance.quantity}.`);
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
    const db2 = await readDb();
    const { publisher_name, contact_person, phone, email, address, credit_days, status } = req.body;
    if (!publisher_name) {
      return res.status(400).json({ error: "Publisher Name is required." });
    }
    const publisher_number = nextCode(db2.publishers, "publisher_number", "PUB");
    const newPublisher = {
      id: makeId("pub"),
      publisher_number,
      publisher_name,
      contact_person,
      phone,
      email,
      address,
      credit_days: Number(credit_days) || 30,
      status: status || "active",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.publishers.push(newPublisher);
    createLog(db2, "Publisher", "Create", publisher_number, `Created publisher ${publisher_name} (${publisher_number})`);
    await writeDb(db2, ["publishers", "live_logs"]);
    res.status(201).json(newPublisher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/publishers/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const { publisher_name, contact_person, phone, email, address, credit_days, status } = req.body;
    const publisher = db2.publishers.find((p) => p.id === id);
    if (!publisher) {
      return res.status(404).json({ error: "Publisher not found." });
    }
    publisher.publisher_name = publisher_name || publisher.publisher_name;
    publisher.contact_person = contact_person !== void 0 ? contact_person : publisher.contact_person;
    publisher.phone = phone !== void 0 ? phone : publisher.phone;
    publisher.email = email !== void 0 ? email : publisher.email;
    publisher.address = address !== void 0 ? address : publisher.address;
    publisher.credit_days = credit_days !== void 0 ? Number(credit_days) : publisher.credit_days;
    publisher.status = status || publisher.status;
    createLog(db2, "Publisher", "Update", publisher.publisher_number, `Updated publisher ${publisher.publisher_name}`);
    await writeDb(db2, ["publishers", "live_logs"]);
    res.json(publisher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/locations", async (req, res) => {
  try {
    const db2 = await readDb();
    const { name, type, city, address, contact_person, phone, status } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Name and Type are required." });
    }
    const prefix = type === "warehouse" ? "WH" : type === "shop" ? "SHOP" : "SCH";
    const code = nextCode(db2.locations.filter((l) => l.type === type), "code", prefix);
    const newLocation = {
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
    db2.locations.push(newLocation);
    createLog(db2, "Location", "Create", code, `Created location ${name} (${code})`);
    await writeDb(db2, ["locations", "live_logs"]);
    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/locations/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const { name, type, city, address, contact_person, phone, status } = req.body;
    const location = db2.locations.find((l) => l.id === id);
    if (!location) {
      return res.status(404).json({ error: "Location not found." });
    }
    location.name = name || location.name;
    location.type = type || location.type;
    location.city = city !== void 0 ? city : location.city;
    location.address = address !== void 0 ? address : location.address;
    location.contact_person = contact_person !== void 0 ? contact_person : location.contact_person;
    location.phone = phone !== void 0 ? phone : location.phone;
    location.status = status || location.status;
    createLog(db2, "Location", "Update", location.code, `Updated location ${location.name}`);
    await writeDb(db2, ["locations", "live_logs"]);
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/categories", async (req, res) => {
  try {
    const db2 = await readDb();
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });
    const newCat = {
      id: makeId("cat"),
      name,
      status: status || "active"
    };
    db2.categories.push(newCat);
    createLog(db2, "Category", "Create", "CAT-NEW", `Created category ${name}`);
    await writeDb(db2, ["categories", "live_logs"]);
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/categories/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const { name, status } = req.body;
    const cat = db2.categories.find((c) => c.id === id);
    if (!cat) return res.status(404).json({ error: "Category not found." });
    cat.name = name || cat.name;
    cat.status = status || cat.status;
    createLog(db2, "Category", "Update", "CAT-UPD", `Updated category ${cat.name}`);
    await writeDb(db2, ["categories", "live_logs"]);
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/subjects", async (req, res) => {
  try {
    const db2 = await readDb();
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });
    const newSub = {
      id: makeId("sub"),
      name,
      status: status || "active"
    };
    db2.subjects.push(newSub);
    createLog(db2, "Subject", "Create", "SUB-NEW", `Created subject ${name}`);
    await writeDb(db2, ["subjects", "live_logs"]);
    res.status(201).json(newSub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/subjects/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const { name, status } = req.body;
    const sub = db2.subjects.find((s) => s.id === id);
    if (!sub) return res.status(404).json({ error: "Subject not found." });
    sub.name = name || sub.name;
    sub.status = status || sub.status;
    createLog(db2, "Subject", "Update", "SUB-UPD", `Updated subject ${sub.name}`);
    await writeDb(db2, ["subjects", "live_logs"]);
    res.json(sub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/classes", async (req, res) => {
  try {
    const db2 = await readDb();
    const { name, status } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required." });
    const newCls = {
      id: makeId("cls"),
      name,
      status: status || "active"
    };
    db2.classes.push(newCls);
    createLog(db2, "Class", "Create", "CLS-NEW", `Created class ${name}`);
    await writeDb(db2, ["classes", "live_logs"]);
    res.status(201).json(newCls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/classes/:id", async (req, res) => {
  try {
    const db2 = await readDb();
    const { id } = req.params;
    const { name, status } = req.body;
    const cls = db2.classes.find((c) => c.id === id);
    if (!cls) return res.status(404).json({ error: "Class not found." });
    cls.name = name || cls.name;
    cls.status = status || cls.status;
    createLog(db2, "Class", "Update", "CLS-UPD", `Updated class ${cls.name}`);
    await writeDb(db2, ["classes", "live_logs"]);
    res.json(cls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/books", async (req, res) => {
  try {
    const db2 = await readDb();
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
    if (!db2.publishers.some((p) => p.id === publisher_id)) return res.status(404).json({ error: "Publisher not found." });
    if (!db2.categories.some((c) => c.id === category_id)) return res.status(404).json({ error: "Category not found." });
    if (!db2.subjects.some((sub) => sub.id === subject_id)) return res.status(404).json({ error: "Subject not found." });
    if (!db2.classes.some((cls) => cls.id === class_id)) return res.status(404).json({ error: "Class not found." });
    if (opening_stock_qty && opening_stock_location_id && !db2.locations.some((l) => l.id === opening_stock_location_id)) {
      return res.status(404).json({ error: "Opening stock location not found." });
    }
    if (barcode && db2.books.some((b) => b.barcode && b.barcode === barcode)) {
      return res.status(400).json({ error: "Another book already uses this barcode." });
    }
    if (ISBN && db2.books.some((b) => b.ISBN && b.ISBN === ISBN)) {
      return res.status(400).json({ error: "Another book already uses this ISBN." });
    }
    const book_number = nextCode(db2.books, "book_number", "BK");
    const newBook = {
      id: makeId("book"),
      book_number,
      title,
      barcode: barcode || void 0,
      ISBN: ISBN || void 0,
      publisher_id,
      category_id,
      subject_id,
      class_id,
      purchase_cost: Number(purchase_cost) || 0,
      sale_price: Number(sale_price) || 0,
      reorder_level: reorder_level !== void 0 ? Number(reorder_level) : 20,
      cover_image: cover_image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200",
      status: status || "active",
      notes: notes || void 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.books.push(newBook);
    createLog(db2, "Book", "Create", book_number, `Created book "${title}" (${book_number})`);
    const opQty = Number(opening_stock_qty) || 0;
    if (opQty > 0 && opening_stock_location_id) {
      const entryId = makeId("stk-entry");
      const entry_number = nextCode(db2.stock_entries, "entry_number", "ENT");
      const newEntry = {
        id: entryId,
        entry_number,
        date: (/* @__PURE__ */ new Date()).toISOString(),
        book_id: newBook.id,
        location_id: opening_stock_location_id,
        quantity: opQty,
        unit_cost: newBook.purchase_cost,
        reference_number: "OPENING",
        notes: opening_stock_notes || "Opening Stock during book registration",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      db2.stock_entries.push(newEntry);
      const finalBalance = updateStockBalance(db2, newBook.id, opening_stock_location_id, opQty);
      const histId = makeId("stk-hist");
      const newHist = {
        id: histId,
        date: (/* @__PURE__ */ new Date()).toISOString(),
        book_id: newBook.id,
        location_id: opening_stock_location_id,
        movement_type: "Opening Stock",
        quantity_in: opQty,
        quantity_out: 0,
        balance_after: finalBalance,
        reference_number: "OPENING",
        notes: opening_stock_notes || "Opening Stock",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      db2.stock_history.push(newHist);
    }
    await writeDb(db2, ["books", "live_logs", "stock_entries", "stock_balances", "stock_history"]);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/add-stock", async (req, res) => {
  try {
    const db2 = await readDb();
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
      return res.status(400).json({ error: "Required field: Location." });
    }
    const location = db2.locations.find((l) => l.id === location_id);
    if (!location) {
      return res.status(404).json({ error: "Location not found." });
    }
    if (publisher_id) {
      const publisher = db2.publishers.find((p) => p.id === publisher_id);
      if (!publisher) {
        return res.status(404).json({ error: "Publisher not found." });
      }
    }
    const stockItems = Array.isArray(items) && items.length > 0 ? items : [
      {
        book_id,
        quantity,
        unit_cost,
        sale_price
      }
    ];
    if (stockItems.length === 0) {
      return res.status(400).json({ error: "Please add at least one book." });
    }
    const createdEntries = [];
    const createdHistory = [];
    let totalQuantity = 0;
    let salePriceUpdatedCount = 0;
    for (const item of stockItems) {
      const itemBookId = item.book_id;
      const itemQuantity = Number(item.quantity);
      const itemUnitCost = item.unit_cost !== void 0 && item.unit_cost !== "" ? Number(item.unit_cost) : void 0;
      const hasSalePrice = item.sale_price !== void 0 && item.sale_price !== null && item.sale_price !== "";
      const itemSalePrice = hasSalePrice ? Number(item.sale_price) : void 0;
      if (!itemBookId) {
        return res.status(400).json({ error: "Book is required for every stock item." });
      }
      if (!itemQuantity || itemQuantity <= 0) {
        return res.status(400).json({ error: "Quantity must be greater than 0 for every stock item." });
      }
      if (hasSalePrice && (Number.isNaN(itemSalePrice) || Number(itemSalePrice) < 0)) {
        return res.status(400).json({ error: "Sale price must be 0 or greater when entered." });
      }
      const book = db2.books.find((b) => b.id === itemBookId);
      if (!book) {
        return res.status(404).json({ error: "One selected book was not found." });
      }
      if (publisher_id && book.publisher_id !== publisher_id) {
        return res.status(400).json({
          error: `Book "${book.title}" does not belong to the selected publisher.`
        });
      }
      if (hasSalePrice && itemSalePrice !== void 0 && !Number.isNaN(itemSalePrice)) {
        book.sale_price = itemSalePrice;
        salePriceUpdatedCount += 1;
      }
      const entryNumber = nextCode(db2.stock_entries, "entry_number", "ENT");
      const finalNotes = [
        notes || "",
        purchase_type === "set" || purchase_type === "pair" || purchase_type === "bundle" ? `Set/Pair: ${set_name || "Unnamed Set"}` : "",
        hasSalePrice && itemSalePrice !== void 0 && !Number.isNaN(itemSalePrice) ? `Sale Price Updated: ${itemSalePrice}` : ""
      ].filter(Boolean).join(" | ");
      const newEntry = {
        id: makeId("stk-entry"),
        entry_number: entryNumber,
        date: date || (/* @__PURE__ */ new Date()).toISOString(),
        book_id: itemBookId,
        location_id,
        quantity: itemQuantity,
        unit_cost: itemUnitCost !== void 0 && !Number.isNaN(itemUnitCost) ? itemUnitCost : book.purchase_cost,
        reference_number: reference_number || void 0,
        notes: finalNotes || void 0,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      db2.stock_entries.push(newEntry);
      const finalBalance = updateStockBalance(db2, itemBookId, location_id, itemQuantity);
      const newHist = {
        id: makeId("stk-hist"),
        date: date || (/* @__PURE__ */ new Date()).toISOString(),
        book_id: itemBookId,
        location_id,
        movement_type: "Add Stock",
        quantity_in: itemQuantity,
        quantity_out: 0,
        balance_after: finalBalance,
        reference_number: reference_number || void 0,
        notes: finalNotes || void 0,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      db2.stock_history.push(newHist);
      createdEntries.push(newEntry);
      createdHistory.push(newHist);
      totalQuantity += itemQuantity;
    }
    const logReference = reference_number || createdEntries[0]?.entry_number || "STOCK-ADD";
    createLog(
      db2,
      "Stock",
      "Add",
      logReference,
      purchase_type === "set" || purchase_type === "pair" || purchase_type === "bundle" ? `Added ${totalQuantity} total units from set/pair "${set_name || "Unnamed Set"}"${salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""}` : `Added ${totalQuantity} total stock units${salePriceUpdatedCount > 0 ? ` and updated sale price for ${salePriceUpdatedCount} book(s)` : ""}`
    );
    await writeDb(db2, ["books", "stock_entries", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json({
      message: "Stock added successfully.",
      entries: createdEntries,
      history: createdHistory,
      total_quantity: totalQuantity,
      sale_price_updated_count: salePriceUpdatedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/sales", async (req, res) => {
  try {
    const db2 = await readDb();
    const { date, location_id, customer_name, book_id, quantity, sale_price, discount, payment_method, notes } = req.body;
    if (!location_id || !book_id || !quantity || !sale_price) {
      return res.status(400).json({ error: "Required fields: Selling Location, Book, Quantity, and Sale Price." });
    }
    const qty = Number(quantity);
    const available = getStockBalance(db2, book_id, location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }
    const book = db2.books.find((b) => b.id === book_id);
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }
    const price = Number(sale_price);
    const disc = Number(discount) || 0;
    const totalAmount = price * qty - disc;
    const sale_number = nextPlainCode(db2.sales, "sale_number", "SL");
    const newSale = {
      id: makeId("sale"),
      sale_number,
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      location_id,
      customer_name: customer_name || void 0,
      payment_method: payment_method || "Cash",
      notes: notes || void 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      total_amount: totalAmount,
      discount: disc
    };
    const newSaleItem = {
      id: makeId("sitem"),
      sale_id: newSale.id,
      book_id,
      quantity: qty,
      unit_price: price,
      discount: disc,
      line_total: totalAmount
    };
    db2.sales.push(newSale);
    db2.sale_items.push(newSaleItem);
    const finalBalance = updateStockBalance(db2, book_id, location_id, -qty);
    const newHist = {
      id: makeId("stk-hist"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id,
      movement_type: "Sale",
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalBalance,
      reference_number: sale_number,
      notes: `Sale to ${customer_name || "Walk-in Customer"}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.stock_history.push(newHist);
    createLog(db2, "Sales", "Sale", sale_number, `Sold ${qty} units of "${book.title}" for total ${totalAmount}`);
    await writeDb(db2, ["sales", "sale_items", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newSale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/customer-returns", async (req, res) => {
  try {
    const db2 = await readDb();
    const { date, original_sale_number, customer_name, book_id, location_id, quantity, reason, notes } = req.body;
    if (!book_id || !location_id || !quantity || !reason) {
      return res.status(400).json({ error: "Required fields: Book, Location, Quantity, and Reason." });
    }
    const qty = Number(quantity);
    const book = db2.books.find((b) => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    const return_number = nextPlainCode(db2.customer_returns, "return_number", "RET");
    const newReturn = {
      id: makeId("cret"),
      return_number,
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      customer_name: customer_name || void 0,
      original_sale_number: original_sale_number || void 0,
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: notes || void 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.customer_returns.push(newReturn);
    const finalBalance = updateStockBalance(db2, book_id, location_id, qty);
    const newHist = {
      id: makeId("stk-hist"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id,
      movement_type: "Customer Return",
      quantity_in: qty,
      quantity_out: 0,
      balance_after: finalBalance,
      reference_number: return_number,
      notes: `Customer Return: ${reason}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.stock_history.push(newHist);
    createLog(db2, "Returns", "Customer Return", return_number, `Received return of ${qty} units of "${book.title}"`);
    await writeDb(db2, ["customer_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/publisher-returns", async (req, res) => {
  try {
    const db2 = await readDb();
    const { date, publisher_id, book_id, location_id, quantity, reason, notes } = req.body;
    if (!publisher_id || !book_id || !location_id || !quantity || !reason) {
      return res.status(400).json({ error: "Required fields: Publisher, Book, Location, Quantity, and Reason." });
    }
    const qty = Number(quantity);
    const available = getStockBalance(db2, book_id, location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }
    const book = db2.books.find((b) => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    const return_number = nextPlainCode(db2.publisher_returns, "return_number", "PRT");
    const newReturn = {
      id: makeId("pret"),
      return_number,
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      publisher_id,
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: notes || void 0,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.publisher_returns.push(newReturn);
    const finalBalance = updateStockBalance(db2, book_id, location_id, -qty);
    const newHist = {
      id: makeId("stk-hist"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id,
      movement_type: "Return to Publisher",
      quantity_in: 0,
      quantity_out: qty,
      balance_after: finalBalance,
      reference_number: return_number,
      notes: `Publisher Return: ${reason}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.stock_history.push(newHist);
    createLog(db2, "Returns", "Publisher Return", return_number, `Returned ${qty} units of "${book.title}" to publisher`);
    await writeDb(db2, ["publisher_returns", "stock_balances", "stock_history", "live_logs"]);
    res.status(201).json(newReturn);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    if (qty <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0." });
    }
    const available = getStockBalance(db2, book_id, from_location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Source location only has ${available} units.` });
    }
    const book = db2.books.find((b) => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    const transfer_number = nextPlainCode(db2.stock_transfers, "transfer_number", "TRN");
    const newTransfer = {
      id: makeId("trn"),
      transfer_number,
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      from_location_id,
      to_location_id,
      book_id,
      quantity: qty,
      notes: notes || void 0,
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
    res.status(500).json({ error: error.message });
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
    if (qty <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0." });
    }
    const available = getStockBalance(db2, book_id, location_id);
    if (qty > available) {
      return res.status(400).json({ error: `Insufficient stock! Selected location only has ${available} units.` });
    }
    const book = db2.books.find((b) => b.id === book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    const newRecord = {
      id: makeId("dmg"),
      date: date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id,
      location_id,
      quantity: qty,
      reason,
      notes: notes || void 0,
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
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/smart-entry", async (req, res) => {
  try {
    const db2 = await readDb();
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
    if (!db2.locations.some((l) => l.id === location_id)) {
      return res.status(404).json({ error: "Stock location not found." });
    }
    if (barcode && db2.books.some((b) => b.barcode && b.barcode === barcode)) {
      return res.status(400).json({ error: "Another book already uses this barcode." });
    }
    if (ISBN && db2.books.some((b) => b.ISBN && b.ISBN === ISBN)) {
      return res.status(400).json({ error: "Another book already uses this ISBN." });
    }
    let finalPublisherId = publisher_id;
    let finalSubjectId = subject_id;
    let finalCategoryId = category_id;
    let finalClassId = class_id;
    const created = [];
    if (!finalPublisherId) {
      if (!publisher_name) return res.status(400).json({ error: "Publisher is required." });
      const publisher_number = nextCode(db2.publishers, "publisher_number", "PUB");
      const publisher = {
        id: makeId("pub"),
        publisher_number,
        publisher_name,
        phone: publisher_phone || void 0,
        credit_days: Number(publisher_credit_days) || 30,
        status: "active",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      db2.publishers.push(publisher);
      finalPublisherId = publisher.id;
      created.push(`Publisher: ${publisher.publisher_name}`);
      createLog(db2, "Publisher", "Create", publisher_number, `Created publisher ${publisher.publisher_name} (${publisher_number})`);
    } else if (!db2.publishers.some((p) => p.id === finalPublisherId)) {
      return res.status(404).json({ error: "Publisher not found." });
    }
    if (!finalSubjectId) {
      if (!subject_name) return res.status(400).json({ error: "Subject is required." });
      const subject = { id: makeId("sub"), name: subject_name, status: "active" };
      db2.subjects.push(subject);
      finalSubjectId = subject.id;
      created.push(`Subject: ${subject.name}`);
      createLog(db2, "Subject", "Create", "SUB-NEW", `Created subject ${subject.name}`);
    } else if (!db2.subjects.some((s) => s.id === finalSubjectId)) {
      return res.status(404).json({ error: "Subject not found." });
    }
    if (!finalCategoryId) {
      if (!category_name) return res.status(400).json({ error: "Category is required." });
      const category = { id: makeId("cat"), name: category_name, status: "active" };
      db2.categories.push(category);
      finalCategoryId = category.id;
      created.push(`Category: ${category.name}`);
      createLog(db2, "Category", "Create", "CAT-NEW", `Created category ${category.name}`);
    } else if (!db2.categories.some((c) => c.id === finalCategoryId)) {
      return res.status(404).json({ error: "Category not found." });
    }
    if (!finalClassId) {
      if (!class_name) return res.status(400).json({ error: "Class is required." });
      const classRecord = { id: makeId("cls"), name: class_name, status: "active" };
      db2.classes.push(classRecord);
      finalClassId = classRecord.id;
      created.push(`Class: ${classRecord.name}`);
      createLog(db2, "Class", "Create", "CLS-NEW", `Created class ${classRecord.name}`);
    } else if (!db2.classes.some((c) => c.id === finalClassId)) {
      return res.status(404).json({ error: "Class not found." });
    }
    const book_number = nextCode(db2.books, "book_number", "BK");
    const book = {
      id: makeId("book"),
      book_number,
      title,
      barcode: barcode || void 0,
      ISBN: ISBN || void 0,
      publisher_id: finalPublisherId,
      category_id: finalCategoryId,
      subject_id: finalSubjectId,
      class_id: finalClassId,
      purchase_cost: Number(purchase_cost) || 0,
      sale_price: Number(sale_price) || 0,
      reorder_level: reorder_level !== void 0 ? Number(reorder_level) : DEFAULT_SETTINGS.globalReorderLevel,
      cover_image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200",
      status: "active",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.books.push(book);
    created.push(`Book: ${book.title}`);
    createLog(db2, "Book", "Create", book_number, `Created book "${book.title}" (${book_number})`);
    const entry_number = nextCode(db2.stock_entries, "entry_number", "ENT");
    const stockEntry = {
      id: makeId("stk-entry"),
      entry_number,
      date: stock_date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id: book.id,
      location_id,
      quantity: qty,
      unit_cost: Number(purchase_cost) || 0,
      reference_number: stock_reference_number || "SMART-ENTRY",
      notes: stock_notes || `Smart-entry stock received for ${book.title}`,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    db2.stock_entries.push(stockEntry);
    const finalBalance = updateStockBalance(db2, book.id, location_id, qty);
    db2.stock_history.push({
      id: makeId("stk-hist"),
      date: stock_date || (/* @__PURE__ */ new Date()).toISOString(),
      book_id: book.id,
      location_id,
      movement_type: "Opening Stock",
      quantity_in: qty,
      quantity_out: 0,
      balance_after: finalBalance,
      reference_number: entry_number,
      notes: stock_notes || "Smart Entry Opening Stock",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    created.push(`Received stock: ${qty} units`);
    createLog(db2, "Smart Entry", "Create", entry_number, `Smart entry completed for "${book.title}" with ${qty} units`);
    await writeDb(db2, [
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
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/books/:id", async (req, res) => {
  try {
    const db2 = await readDb();
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
    const book = db2.books.find((b) => b.id === id);
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }
    if (publisher_id && !db2.publishers.some((p) => p.id === publisher_id)) return res.status(404).json({ error: "Publisher not found." });
    if (category_id && !db2.categories.some((c) => c.id === category_id)) return res.status(404).json({ error: "Category not found." });
    if (subject_id && !db2.subjects.some((sub) => sub.id === subject_id)) return res.status(404).json({ error: "Subject not found." });
    if (class_id && !db2.classes.some((cls) => cls.id === class_id)) return res.status(404).json({ error: "Class not found." });
    if (barcode && db2.books.some((b) => b.id !== id && b.barcode && b.barcode === barcode)) return res.status(400).json({ error: "Another book already uses this barcode." });
    if (ISBN && db2.books.some((b) => b.id !== id && b.ISBN && b.ISBN === ISBN)) return res.status(400).json({ error: "Another book already uses this ISBN." });
    book.title = title || book.title;
    book.barcode = barcode !== void 0 ? barcode : book.barcode;
    book.ISBN = ISBN !== void 0 ? ISBN : book.ISBN;
    book.publisher_id = publisher_id || book.publisher_id;
    book.category_id = category_id || book.category_id;
    book.subject_id = subject_id || book.subject_id;
    book.class_id = class_id || book.class_id;
    book.purchase_cost = purchase_cost !== void 0 ? Number(purchase_cost) : book.purchase_cost;
    book.sale_price = sale_price !== void 0 ? Number(sale_price) : book.sale_price;
    book.reorder_level = reorder_level !== void 0 ? Number(reorder_level) : book.reorder_level;
    book.cover_image = cover_image !== void 0 ? cover_image : book.cover_image;
    book.status = status || book.status;
    book.notes = notes !== void 0 ? notes : book.notes;
    createLog(db2, "Book", "Update", book.book_number, `Updated book "${book.title}"`);
    await writeDb(db2, ["books", "live_logs"]);
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
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
  await ensureAuthStoreInitialized();
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(
      "/assets",
      express.static(path2.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true
      })
    );
    app.use(
      express.static(distPath, {
        maxAge: "1h"
      })
    );
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(path2.join(distPath, "index.html"));
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

// vercel-entry.ts
var vercel_entry_default = server_default;
export {
  vercel_entry_default as default
};
