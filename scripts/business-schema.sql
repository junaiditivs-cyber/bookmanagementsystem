-- IVS Books Management business data safeguards.
-- Safe to run more than once on PostgreSQL/Supabase.

CREATE TABLE IF NOT EXISTS app_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS publishers_name_unique_ci
  ON publishers (lower(trim(publisher_name)));

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique_ci
  ON categories (lower(trim(name)));

CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_unique_ci
  ON subjects (lower(trim(name)));

CREATE UNIQUE INDEX IF NOT EXISTS classes_name_unique_ci
  ON classes (lower(trim(name)));

CREATE UNIQUE INDEX IF NOT EXISTS locations_name_type_unique_ci
  ON locations (lower(trim(name)), type);

CREATE UNIQUE INDEX IF NOT EXISTS stock_balances_book_location_unique
  ON stock_balances (book_id, location_id);