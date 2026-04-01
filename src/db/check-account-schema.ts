import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function checkSchema() {
  try {
    console.log("Checking account table schema...\n");

    // Get column information
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'account'
      ORDER BY ordinal_position
    `;

    console.log("Columns:");
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Get primary key information
    const pk = await sql`
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'account'::regclass AND i.indisprimary
      ORDER BY a.attnum
    `;

    console.log("\nPrimary Key:");
    pk.forEach((key: any) => {
      console.log(`  - ${key.column_name}`);
    });

    // Try a simple query
    console.log("\nTrying simple query...");
    const result = await sql`SELECT * FROM "account" LIMIT 1`;
    console.log(`✓ Query successful! Found ${result.length} rows`);

  } catch (error) {
    console.error("Error:", error);
  }
}

checkSchema();
