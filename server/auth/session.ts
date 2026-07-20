import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../../src/db/index.ts";
import { isLocalAuthStore } from "./store.ts";

const PgStore = connectPgSimple(session);
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

function getSessionSecret(): string {
  const configured = String(process.env.SESSION_SECRET || "").trim();

  if (configured.length >= 32) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be configured with at least 32 characters in production.",
    );
  }

  console.warn(
    "SESSION_SECRET is missing or too short. Using a development-only fallback secret.",
  );

  return "development-only-change-this-session-secret-please";
}

export function createSessionMiddleware() {
  const localMode = isLocalAuthStore();

  if (localMode && process.env.NODE_ENV === "production") {
    console.warn(
      "DATABASE_MODE=local is using an in-memory session store. Use PostgreSQL mode for persistent production sessions.",
    );
  }

  const store = localMode
    ? new session.MemoryStore()
    : new PgStore({
        pool,
        tableName: "user_sessions",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 15,
      });

  return session({
    name: "ivs.books.sid",
    secret: getSessionSecret(),
    store,
    resave: false,
    saveUninitialized: false,
    rolling: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: EIGHT_HOURS_MS,
      path: "/",
    },
  });
}

export const SESSION_DURATION_MS = EIGHT_HOURS_MS;
export const REMEMBER_ME_DURATION_MS = 30 * 24 * 60 * 60 * 1000;