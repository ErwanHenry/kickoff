-- Fix better-auth signup 500 (2026-07-12)
-- Root cause: Drizzle schema + DB did not match better-auth v1.5 requirements:
--   1. "account" must have its own "id" text primary key ("accountId" is the
--      provider-side identifier, NOT the primary key). Error in prod was:
--      [Better Auth]: The field "id" does not exist in the "account" Drizzle schema.
--   2. "session" must have "created_at"/"updated_at" (written on every session create).
--   3. "verification" table missing (used by the magic-link plugin).
-- All steps are idempotent and additive. Applied to prod via GET /api/apply-migration.

-- === account: restore "id" as primary key ===
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id" text;
--> statement-breakpoint
UPDATE "account" SET "id" = "account_id" WHERE "id" IS NULL;
--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_account_id_provider_id_pk";
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey";
--> statement-breakpoint
ALTER TABLE "account" ADD PRIMARY KEY ("id");
--> statement-breakpoint

-- === account: better-auth v1.5 token fields (nullable, used by OAuth flows) ===
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
-- NOTE: legacy nullable "expires_at" column is intentionally left in place
-- (no longer referenced by the Drizzle schema; dropping data is out of scope).

-- === session: timestamps required by better-auth on session creation ===
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- === verification: required by the magic-link plugin ===
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
