-- Create better-auth tables from scratch
-- These tables are required for better-auth to function

-- Session table
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" timestamp NOT NULL,
  "token" text UNIQUE NOT NULL,
  "ip_address" text,
  "user_agent" text
);

-- Account table with composite primary key
CREATE TABLE IF NOT EXISTS "account" (
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "expires_at" timestamp,
  "password" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY("account_id", "provider_id")
);

-- Users table (update if exists, or create new)
-- Note: users table might already exist, so we use ALTER TABLE if needed
-- Check if users table has all required columns
DO $$
BEGIN
  -- Check if users table exists, if not create it
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE "users" (
      "id" text PRIMARY KEY,
      "email" text UNIQUE,
      "email_verified" boolean DEFAULT false NOT NULL,
      "name" text NOT NULL,
      "phone" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  END IF;

  -- Add missing columns to users table if they don't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
  END IF;
END $$;
