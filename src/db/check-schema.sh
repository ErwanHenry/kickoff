#!/bin/bash

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

echo "Checking account table schema..."
psql $DATABASE_URL_UNPOOLED << SQL
-- Check account table constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'account';

-- Check existing accounts
SELECT COUNT(*) as existing_accounts FROM "account";
SQL
