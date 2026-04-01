import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

    console.log("Applying migration: Add id column as primary key to account table");

    // Step 1: Add the id column as nullable first
    console.log("[1/6] Adding id column (nullable)...");
    await sql`
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id" text
    `;

    // Step 2: Generate unique IDs for existing rows
    console.log("[2/6] Generating unique IDs for existing rows...");
    await sql`
      UPDATE "account" SET "id" = "account_id" WHERE "id" IS NULL
    `;

    // Step 3: Make the column NOT NULL
    console.log("[3/6] Making id column NOT NULL...");
    await sql`
      ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL
    `;

    // Step 4: Drop composite primary key if it exists
    console.log("[4/6] Dropping composite primary key (if exists)...");
    await sql`
      ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_account_id_provider_id_pk"
    `;

    // Step 5: Drop any single-column primary key if it exists
    console.log("[5/6] Dropping old primary key (if exists)...");
    await sql`
      ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey"
    `;

    // Step 6: Add the id column as primary key
    console.log("[6/6] Adding id as primary key...");
    await sql`
      ALTER TABLE "account" ADD PRIMARY KEY ("id")
    `;

    // Step 7: Add missing timestamp columns
    console.log("[7/7] Adding missing timestamp columns...");
    await sql`
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL
    `;
    await sql`
      ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL
    `;

    console.log("✓ Migration applied successfully!");

    return NextResponse.json({
      success: true,
      message: "Migration applied successfully"
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
