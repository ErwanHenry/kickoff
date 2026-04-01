-- Fix account table to use single id primary key instead of composite key

-- Step 1: Add the id column (nullable first)
ALTER TABLE "account" ADD COLUMN "id" text;

-- Step 2: Populate id with unique values (concatenation of account_id and provider_id)
UPDATE "account" SET "id" = account_id || '_' || provider_id;

-- Step 3: Make id NOT NULL
ALTER TABLE "account" ALTER COLUMN "id" SET NOT NULL;

-- Step 4: Drop the old composite primary key constraint
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey";

-- Step 5: Add primary key on id column
ALTER TABLE "account" ADD PRIMARY KEY ("id");
