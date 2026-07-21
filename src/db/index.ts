import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pkg;

const DATABASE_MODE = (
  process.env.DATABASE_MODE || "local"
).toLowerCase();

const connectionString = String(
  process.env.DATABASE_URL || "",
).trim();

if (
  DATABASE_MODE === "postgres" &&
  !connectionString
) {
  throw new Error(
    "DATABASE_URL is required when DATABASE_MODE=postgres.",
  );
}

if (
  connectionString &&
  !/^postgres(?:ql)?:\/\//i.test(
    connectionString,
  )
) {
  throw new Error(
    "DATABASE_URL must be a PostgreSQL connection string beginning with postgres:// or postgresql://.",
  );
}

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: {
          rejectUnauthorized: false,
        },
        connectionTimeoutMillis: 15000,
        max: 5,
      }
    : {
        connectionTimeoutMillis: 15000,
      },
);

pool.on("error", (error) => {
  console.error(
    "Unexpected error on idle SQL pool client:",
    error,
  );
});

export const db = drizzle(pool, {
  schema,
});