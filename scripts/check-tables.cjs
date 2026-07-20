require("dotenv").config();

const postgres = require("postgres");

const url = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL or SUPABASE_DATABASE_URL missing in .env");
  process.exit(1);
}

const sql = postgres(url, {
  ssl: "require",
});

async function main() {
  try {
    console.log("Checking Supabase connection...");

    const timeResult = await sql.unsafe("select now() as current_time");
    console.log("Supabase connected successfully");
    console.table(timeResult);

    const tables = await sql.unsafe(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);

    console.log("Tables found:", tables.length);
    console.table(tables);
  } catch (error) {
    console.error("Tables check failed");
    console.error(error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();