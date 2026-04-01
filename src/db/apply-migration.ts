import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

async function applyMigration() {
  try {
    console.log("Applying migration: Fix account table composite primary key");
    
    // Drop existing primary key constraint and recreate as composite key
    await sql`
      ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey"
    `;
    
    await sql`
      ALTER TABLE "account" ADD CONSTRAINT "account_account_id_provider_id_pk" PRIMARY KEY("account_id","provider_id")
    `;

    console.log("✓ Migration applied successfully!");
    console.log("  - Dropped old primary key on account_id");
    console.log("  - Created composite primary key on (account_id, provider_id)");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
