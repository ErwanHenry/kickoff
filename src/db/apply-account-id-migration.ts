import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function applyMigration() {
  try {
    console.log("Applying migration: Add id column as primary key to account table");

    // Step 1: Add the id column as nullable first
    console.log("[1/6] Adding id column (nullable)...");
    await sql`
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id" text
    `;
    console.log("  ✓ Column added (or already exists)");

    // Step 2: Generate unique IDs for existing rows
    console.log("[2/6] Generating unique IDs for existing rows...");
    await sql`
      UPDATE "account" SET "id" = "account_id" WHERE "id" IS NULL
    `;
    console.log("  ✓ IDs generated");

    // Step 3: Make the column NOT NULL
    console.log("[3/6] Making id column NOT NULL...");
    await sql`
      ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL
    `;
    console.log("  ✓ Column is now NOT NULL");

    // Step 4: Drop composite primary key if it exists
    console.log("[4/6] Dropping composite primary key (if exists)...");
    await sql`
      ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_account_id_provider_id_pk"
    `;
    console.log("  ✓ Composite PK dropped (if it existed)");

    // Step 5: Drop any single-column primary key if it exists
    console.log("[5/6] Dropping old primary key (if exists)...");
    await sql`
      ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey"
    `;
    console.log("  ✓ Old PK dropped (if it existed)");

    // Step 6: Add the id column as primary key
    console.log("[6/6] Adding id as primary key...");
    await sql`
      ALTER TABLE "account" ADD PRIMARY KEY ("id")
    `;
    console.log("  ✓ Primary key added on id column");

    console.log("\n✓ Migration applied successfully!");
    console.log("  - Account table now has 'id' as primary key");
    console.log("  - This matches better-auth requirements");
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    throw error;
  }
}

applyMigration();
