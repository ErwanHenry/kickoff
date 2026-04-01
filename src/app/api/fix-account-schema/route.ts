import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL_UNPOOLED!);

    console.log("Fixing account table schema to use accountId as primary key");

    // Step 1: Drop the id column primary key
    console.log("[1/3] Dropping primary key on id...");
    await sql`
      ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey"
    `;

    // Step 2: Drop the id column
    console.log("[2/3] Dropping id column...");
    await sql`
      ALTER TABLE "account" DROP COLUMN IF EXISTS "id"
    `;

    // Step 3: Add primary key on accountId
    console.log("[3/3] Adding primary key on accountId...");
    await sql`
      ALTER TABLE "account" ADD PRIMARY KEY ("account_id")
    `;

    console.log("✓ Schema fixed successfully!");

    return NextResponse.json({
      success: true,
      message: "Account table schema fixed to use accountId as primary key"
    });
  } catch (error) {
    console.error("Schema fix failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
