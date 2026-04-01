#!/bin/bash

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Apply migration using psql
echo "Applying migration: Fix account table composite primary key"

psql $DATABASE_URL_UNPOOLED << SQL
-- Drop existing primary key constraint and recreate as composite key
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey";

ALTER TABLE "account" ADD CONSTRAINT "account_account_id_provider_id_pk" PRIMARY KEY("account_id","provider_id");

SELECT 'Migration applied successfully!' AS result;
SQL
