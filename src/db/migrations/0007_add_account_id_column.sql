-- Add 'id' field as primary key to account table (required by better-auth)
-- Step 1: Add the id column as nullable first
ALTER TABLE "account" ADD COLUMN "id" text;

-- Step 2: Generate unique IDs for existing rows using account_id as base
UPDATE "account" SET "id" = "account_id" WHERE "id" IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL;

-- Step 4: Drop the composite primary key constraint
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_account_id_provider_id_pk";

-- Step 5: Add the id column as primary key
ALTER TABLE "account" ADD PRIMARY KEY ("id");
