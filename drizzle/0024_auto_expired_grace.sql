ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "auto_expired_grace_days" integer DEFAULT 7 NOT NULL;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "expires_on_source" text;
