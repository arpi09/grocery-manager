ALTER TABLE "receipt_purchase_line"
	ADD COLUMN IF NOT EXISTS "unit_price" numeric(10, 2),
	ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'SEK',
	ADD COLUMN IF NOT EXISTS "line_total" numeric(10, 2),
	ADD COLUMN IF NOT EXISTS "store_label" text,
	ADD COLUMN IF NOT EXISTS "purchased_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "receipt_purchase_line_household_key_purchased_idx"
	ON "receipt_purchase_line" ("household_id", "normalized_key", "purchased_at");
