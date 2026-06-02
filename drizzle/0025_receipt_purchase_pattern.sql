CREATE TABLE IF NOT EXISTS "receipt_purchase_line" (
	"id" text PRIMARY KEY NOT NULL,
	"household_id" text NOT NULL REFERENCES "household"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"import_batch_id" text NOT NULL,
	"product_name" text NOT NULL,
	"normalized_key" text NOT NULL,
	"barcode" text,
	"location" text NOT NULL,
	"quantity" numeric(10, 2),
	"unit" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "receipt_purchase_line_household_key_idx"
	ON "receipt_purchase_line" ("household_id", "normalized_key");

CREATE INDEX IF NOT EXISTS "receipt_purchase_line_household_created_idx"
	ON "receipt_purchase_line" ("household_id", "created_at");

CREATE TABLE IF NOT EXISTS "receipt_pattern_dismissal" (
	"household_id" text NOT NULL REFERENCES "household"("id") ON DELETE CASCADE,
	"normalized_key" text NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("household_id", "normalized_key")
);
