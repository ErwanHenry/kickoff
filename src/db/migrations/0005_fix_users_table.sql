-- Fix users table to match the Drizzle schema

-- Step 1: Add phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE "users" ADD COLUMN "phone" text;
  END IF;
END $$;

-- Step 2: Make name column NOT NULL
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

-- Step 3: Make email column NOT NULL (it's required by better-auth)
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- Note: We keep the 'image' column even though it's not in our schema
-- because better-auth might use it for OAuth avatars
