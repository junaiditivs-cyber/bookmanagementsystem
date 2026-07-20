import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

const host = connectionString ? "" : (process.env.SUPABASE_HOST || process.env.SQL_HOST || "localhost");
const dbName = connectionString ? "" : (process.env.SUPABASE_DB_NAME || process.env.SQL_DB_NAME || "postgres");
const user = connectionString ? "" : (process.env.SUPABASE_USER || process.env.SQL_USER || "postgres");
const password = connectionString ? "" : (process.env.SUPABASE_PASSWORD || process.env.SQL_PASSWORD || "");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: connectionString ? {
    url: connectionString,
    ssl: { rejectUnauthorized: false },
  } : {
    host,
    user,
    password,
    database: dbName,
    ssl: false,
  },
  verbose: true,
});
