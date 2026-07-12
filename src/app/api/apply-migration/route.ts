import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

/**
 * Applies migration 0009_fix_better_auth_schema.sql to the production database.
 * Fix for the signup 500: aligns account/session tables with better-auth v1.5
 * requirements and creates the verification table (magic link).
 *
 * Idempotent and additive — safe to call multiple times. See the SQL file in
 * src/db/migrations/0009_fix_better_auth_schema.sql for the full rationale.
 */
export async function GET() {
  const steps: string[] = [];
  try {
    const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
    if (!url) {
      return NextResponse.json(
        { success: false, error: "DATABASE_URL not set" },
        { status: 500 }
      );
    }
    const sql = neon(url);

    // === account: restore "id" as primary key (better-auth requirement) ===
    steps.push("account: add id column");
    await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id" text`;

    steps.push("account: backfill id from account_id");
    await sql`UPDATE "account" SET "id" = "account_id" WHERE "id" IS NULL`;

    steps.push("account: id NOT NULL");
    await sql`ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL`;

    steps.push("account: drop old primary keys");
    await sql`ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_account_id_provider_id_pk"`;
    await sql`ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey"`;

    steps.push("account: add primary key (id)");
    await sql`ALTER TABLE "account" ADD PRIMARY KEY ("id")`;

    // === account: better-auth v1.5 fields ===
    steps.push("account: add token/scope/timestamp columns");
    await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp`;
    await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp`;
    await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text`;
    await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL`;
    await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL`;

    // === session: timestamps required by better-auth ===
    steps.push("session: add created_at/updated_at");
    await sql`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL`;
    await sql`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL`;

    // === verification: required by the magic-link plugin ===
    steps.push("verification: create table");
    await sql`CREATE TABLE IF NOT EXISTS "verification" (
      "id" text PRIMARY KEY,
      "identifier" text NOT NULL,
      "value" text NOT NULL,
      "expires_at" timestamp NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )`;

    steps.push("done");
    return NextResponse.json({
      success: true,
      message: "Migration 0009_fix_better_auth_schema applied",
      steps,
    });
  } catch (error) {
    console.error("Migration 0009 failed:", error);
    return NextResponse.json(
      {
        success: false,
        failedAtStep: steps[steps.length - 1] ?? "init",
        steps,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
