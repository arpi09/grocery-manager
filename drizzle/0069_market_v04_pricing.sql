ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "market_swish_number" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "market_default_price_percent" integer;
