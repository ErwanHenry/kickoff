-- Restore account table to use composite primary key (account_id, provider_id)
-- This is required by better-auth to support multiple auth providers per user

-- Step 1: Drop the single-column primary key on id
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey";

-- Step 2: Drop the id column (no longer needed)
ALTER TABLE "account" DROP COLUMN IF EXISTS "id";

-- Step 3: Restore composite primary key on (account_id, provider_id)
ALTER TABLE "account" ADD PRIMARY KEY ("account_id", "provider_id");
