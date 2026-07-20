import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pkg;

export const createPool = () => {
  const connectionString =
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (connectionString) {
    return new Pool({
      connectionString,

      // Required for Supabase cloud PostgreSQL connections.
      ssl: {
        rejectUnauthorized: false,
      },

      connectionTimeoutMillis: 15000,
    });
  }

  // Fallback for separate PostgreSQL connection fields.
  return new Pool({
    host:
      process.env.SUPABASE_HOST ||
      process.env.SQL_HOST,

    user:
      process.env.SUPABASE_USER ||
      process.env.SQL_USER,

    password:
      process.env.SUPABASE_PASSWORD ||
      process.env.SQL_PASSWORD,

    database:
      process.env.SUPABASE_DB_NAME ||
      process.env.SQL_DB_NAME,

    port:
      Number(
        process.env.SUPABASE_PORT,
      ) || 5432,

    ssl:
      process.env.SUPABASE_SSL ===
        "true" ||
      process.env.SQL_SSL === "true"
        ? {
            rejectUnauthorized:
              false,
          }
        : false,

    connectionTimeoutMillis: 15000,
  });
};

export const pool = createPool();

pool.on("error", (error) => {
  console.error(
    "Unexpected error on idle SQL pool client:",
    error,
  );
});

export const db = drizzle(pool, {
  schema,
});