import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { pool } from "../../src/db/index.ts";
import type {
  AppUserRecord,
  AuthAuditLog,
  LocalAuthData,
  UserRole,
  UserStatus,
} from "./types.ts";

const DATABASE_MODE = (
  process.env.DATABASE_MODE || "local"
).toLowerCase();

const USE_LOCAL_AUTH_STORE =
  DATABASE_MODE === "local";

const AUTH_DATA_PATH = path.join(
  process.cwd(),
  "auth-data.json",
);

const EMPTY_AUTH_DATA: LocalAuthData = {
  users: [],
  audit_logs: [],
};

const MAX_AUDIT_LOGS = 5000;

let localWriteQueue: Promise<void> =
  Promise.resolve();

function normalizeEmail(email: string): string {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeLocalData(
  data: Partial<LocalAuthData> = {},
): LocalAuthData {
  return {
    users: Array.isArray(data.users)
      ? data.users
      : [],

    audit_logs: Array.isArray(data.audit_logs)
      ? data.audit_logs
      : [],
  };
}

async function readLocalData(): Promise<LocalAuthData> {
  try {
    const raw = await fs.readFile(
      AUTH_DATA_PATH,
      "utf8",
    );

    return normalizeLocalData(
      JSON.parse(raw),
    );
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    return normalizeLocalData(
      EMPTY_AUTH_DATA,
    );
  }
}

async function writeLocalData(
  data: LocalAuthData,
): Promise<void> {
  const nextData = normalizeLocalData(data);

  nextData.audit_logs =
    nextData.audit_logs.slice(
      0,
      MAX_AUDIT_LOGS,
    );

  const tmpPath =
    `${AUTH_DATA_PATH}.tmp`;

  await fs.writeFile(
    tmpPath,
    JSON.stringify(nextData, null, 2),
    {
      mode: 0o600,
    },
  );

  await fs.rename(
    tmpPath,
    AUTH_DATA_PATH,
  );
}

async function withLocalWrite<T>(
  mutator: (
    data: LocalAuthData,
  ) => Promise<T> | T,
): Promise<T> {
  let result!: T;

  const runWrite = async () => {
    const data = await readLocalData();

    result = await mutator(data);

    await writeLocalData(data);
  };

  localWriteQueue =
    localWriteQueue.then(
      runWrite,
      runWrite,
    );

  await localWriteQueue;

  return result;
}

function mapPostgresUser(
  row: any,
): AppUserRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),

    password_hash: String(
      row.password_hash,
    ),

    password_history:
      Array.isArray(row.password_history)
        ? row.password_history
        : [],

    role: row.role as UserRole,
    status: row.status as UserStatus,

    must_change_password: Boolean(
      row.must_change_password,
    ),

    failed_login_attempts: Number(
      row.failed_login_attempts || 0,
    ),

    locked_until: row.locked_until
      ? new Date(
          row.locked_until,
        ).toISOString()
      : null,

    session_version: Number(
      row.session_version || 1,
    ),

    last_login_at: row.last_login_at
      ? new Date(
          row.last_login_at,
        ).toISOString()
      : null,

    password_changed_at: new Date(
      row.password_changed_at,
    ).toISOString(),

    created_at: new Date(
      row.created_at,
    ).toISOString(),

    updated_at: new Date(
      row.updated_at,
    ).toISOString(),

    created_by: row.created_by
      ? String(row.created_by)
      : null,

    updated_by: row.updated_by
      ? String(row.updated_by)
      : null,
  };
}

function mapPostgresAudit(
  row: any,
): AuthAuditLog {
  return {
    id: String(row.id),

    timestamp: new Date(
      row.timestamp,
    ).toISOString(),

    actor_user_id:
      row.actor_user_id
        ? String(row.actor_user_id)
        : null,

    actor_email: String(
      row.actor_email,
    ),

    action: String(row.action),

    target_user_id:
      row.target_user_id
        ? String(row.target_user_id)
        : null,

    target_email:
      row.target_email
        ? String(row.target_email)
        : null,

    ip_address:
      row.ip_address
        ? String(row.ip_address)
        : null,

    user_agent:
      row.user_agent
        ? String(row.user_agent)
        : null,

    result: row.result,

    details: String(
      row.details || "",
    ),
  };
}

export async function initializeAuthStore(): Promise<void> {
  if (USE_LOCAL_AUTH_STORE) {
    try {
      await fs.access(
        AUTH_DATA_PATH,
      );
    } catch {
      await writeLocalData(
        EMPTY_AUTH_DATA,
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

export async function countUsers(): Promise<number> {
  if (USE_LOCAL_AUTH_STORE) {
    return (
      await readLocalData()
    ).users.length;
  }

  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS count
      FROM app_users
    `,
  );

  return Number(
    result.rows[0]?.count || 0,
  );
}

export async function listUsers(): Promise<AppUserRecord[]> {
  if (USE_LOCAL_AUTH_STORE) {
    return (
      await readLocalData()
    ).users
      .slice()
      .sort((a, b) =>
        a.name.localeCompare(b.name),
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
    mapPostgresUser,
  );
}

export async function findUserById(
  id: string,
): Promise<AppUserRecord | null> {
  if (USE_LOCAL_AUTH_STORE) {
    return (
      (
        await readLocalData()
      ).users.find(
        (user) => user.id === id,
      ) || null
    );
  }

  const result = await pool.query(
    `
      SELECT *
      FROM app_users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0]
    ? mapPostgresUser(
        result.rows[0],
      )
    : null;
}

export async function findUserByEmail(
  email: string,
): Promise<AppUserRecord | null> {
  const normalized =
    normalizeEmail(email);

  if (USE_LOCAL_AUTH_STORE) {
    return (
      (
        await readLocalData()
      ).users.find(
        (user) =>
          normalizeEmail(
            user.email,
          ) === normalized,
      ) || null
    );
  }

  const result = await pool.query(
    `
      SELECT *
      FROM app_users
      WHERE LOWER(email) =
        LOWER($1)
      LIMIT 1
    `,
    [normalized],
  );

  return result.rows[0]
    ? mapPostgresUser(
        result.rows[0],
      )
    : null;
}

export async function createUserRecord(
  input: Omit<
    AppUserRecord,
    "id" | "created_at" | "updated_at"
  > & {
    id?: string;
  },
): Promise<AppUserRecord> {
  const now =
    new Date().toISOString();

  const record: AppUserRecord = {
    ...input,

    id:
      input.id ||
      randomUUID(),

    email: normalizeEmail(
      input.email,
    ),

    created_at: now,
    updated_at: now,
  };

  if (USE_LOCAL_AUTH_STORE) {
    return withLocalWrite(
      (data) => {
        const emailAlreadyExists =
          data.users.some(
            (user) =>
              normalizeEmail(
                user.email,
              ) === record.email,
          );

        if (emailAlreadyExists) {
          throw new Error(
            "A user with this email already exists.",
          );
        }

        data.users.push(record);

        return record;
      },
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
        record.password_history,
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
      record.updated_by,
    ],
  );

  return mapPostgresUser(
    result.rows[0],
  );
}

export async function updateUserRecord(
  id: string,
  updates: Partial<AppUserRecord>,
): Promise<AppUserRecord> {
  const safeUpdates = {
    ...updates,

    updated_at:
      new Date().toISOString(),
  };

  delete (safeUpdates as any).id;
  delete (
    safeUpdates as any
  ).created_at;

  if (safeUpdates.email) {
    safeUpdates.email =
      normalizeEmail(
        safeUpdates.email,
      );
  }

  if (USE_LOCAL_AUTH_STORE) {
    return withLocalWrite(
      (data) => {
        const index =
          data.users.findIndex(
            (user) =>
              user.id === id,
          );

        if (index === -1) {
          throw new Error(
            "User not found.",
          );
        }

        if (
          safeUpdates.email &&
          data.users.some(
            (user) =>
              user.id !== id &&
              normalizeEmail(
                user.email,
              ) ===
                safeUpdates.email,
          )
        ) {
          throw new Error(
            "A user with this email already exists.",
          );
        }

        data.users[index] = {
          ...data.users[index],
          ...safeUpdates,
        };

        return data.users[index];
      },
    );
  }

  const entries = Object.entries(
    safeUpdates,
  ).filter(
    ([, value]) =>
      value !== undefined,
  );

  if (entries.length === 0) {
    const existing =
      await findUserById(id);

    if (!existing) {
      throw new Error(
        "User not found.",
      );
    }

    return existing;
  }

  const values: unknown[] = [];

  const assignments = entries.map(
    ([key, value], index) => {
      values.push(
        key === "password_history"
          ? JSON.stringify(value)
          : value,
      );

      return (
        `${key} = $${index + 1}` +
        (
          key ===
          "password_history"
            ? "::jsonb"
            : ""
        )
      );
    },
  );

  values.push(id);

  const result = await pool.query(
    `
      UPDATE app_users
      SET ${assignments.join(", ")}
      WHERE id = $${values.length}
      RETURNING *
    `,
    values,
  );

  if (!result.rows[0]) {
    throw new Error(
      "User not found.",
    );
  }

  return mapPostgresUser(
    result.rows[0],
  );
}

export async function countActiveSuperAdmins(
  excludeUserId?: string,
): Promise<number> {
  if (USE_LOCAL_AUTH_STORE) {
    return (
      await readLocalData()
    ).users.filter(
      (user) =>
        user.id !== excludeUserId &&
        user.role ===
          "super_admin" &&
        user.status ===
          "active",
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
      excludeUserId || null,
    ],
  );

  return Number(
    result.rows[0]?.count || 0,
  );
}

export async function addAuthAuditLog(
  log: Omit<
    AuthAuditLog,
    "id" | "timestamp"
  > & {
    id?: string;
    timestamp?: string;
  },
): Promise<AuthAuditLog> {
  const record: AuthAuditLog = {
    ...log,

    id:
      log.id ||
      randomUUID(),

    timestamp:
      log.timestamp ||
      new Date().toISOString(),
  };

  if (USE_LOCAL_AUTH_STORE) {
    return withLocalWrite(
      (data) => {
        data.audit_logs.unshift(
          record,
        );

        data.audit_logs =
          data.audit_logs.slice(
            0,
            MAX_AUDIT_LOGS,
          );

        return record;
      },
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
      record.details,
    ],
  );

  return mapPostgresAudit(
    result.rows[0],
  );
}

export async function listAuthAuditLogs(
  limit = 200,
): Promise<AuthAuditLog[]> {
  const safeLimit = Math.max(
    1,
    Math.min(
      1000,
      Number(limit) || 200,
    ),
  );

  if (USE_LOCAL_AUTH_STORE) {
    return (
      await readLocalData()
    ).audit_logs.slice(
      0,
      safeLimit,
    );
  }

  const result = await pool.query(
    `
      SELECT *
      FROM auth_audit_logs
      ORDER BY timestamp DESC
      LIMIT $1
    `,
    [safeLimit],
  );

  return result.rows.map(
    mapPostgresAudit,
  );
}

export function isLocalAuthStore(): boolean {
  return USE_LOCAL_AUTH_STORE;
}