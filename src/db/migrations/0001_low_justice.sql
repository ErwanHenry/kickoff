-- Drop existing primary key constraint and recreate as composite key
-- Based on better-auth requirements for multi-provider support
ALTER TABLE "account" DROP CONSTRAINT IF EXISTS "account_pkey";
ALTER TABLE "account" ADD CONSTRAINT "account_account_id_provider_id_pk" PRIMARY KEY("account_id","provider_id");